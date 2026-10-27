#!/usr/bin/env bash
set -Eeuo pipefail
: "${IMAGE_REF:?image required}"
: "${DEPLOY_DIR:?configure HOMELAB_COMPOSE_DIR}"
[[ "${DEPLOY_DIR}" = /* && -d "${DEPLOY_DIR}" ]] || exit 1
[[ "${DEPLOY_SERVICE:-}" == demo ]] || exit 1
cd "${DEPLOY_DIR}"
exec 9>/tmp/wapphub-demo-deploy.lock
flock -n 9 || { echo "A deployment is already running"; exit 1; }
# Deployed Compose must use HOMELAB_IMAGE variable for this service.
configured="$(HOMELAB_IMAGE=ci-probe docker compose config --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["services"]["demo"].get("image",""))')"
[[ "$configured" == ci-probe ]] || { echo "Compose lacks HOMELAB_IMAGE parameter"; exit 1; }
previous_container="$(HOMELAB_IMAGE="$IMAGE_REF" docker compose ps -q demo || true)"
previous=""
if [[ -n "$previous_container" ]]; then
  previous="$(docker inspect --format '{{.Config.Image}}' "$previous_container")"
fi
docker pull "$IMAGE_REF"
rollback() {
  if [[ -n "$previous" ]]; then
    echo "Healthcheck failed; rolling back to $previous"
    HOMELAB_IMAGE="$previous" docker compose up -d --no-deps --no-build --force-recreate demo || true
  else
    echo "No previous container to restore"
  fi
}
trap rollback ERR
HOMELAB_IMAGE="$IMAGE_REF" docker compose up -d --no-deps --no-build --force-recreate demo
cid="$(HOMELAB_IMAGE="$IMAGE_REF" docker compose ps -q demo)"
[[ -n "$cid" ]] || exit 1
for i in $(seq 1 36); do
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$cid")"
  if [[ "$health" == healthy ]]; then
    trap - ERR
    echo "Deployed healthy image: $IMAGE_REF"
    exit 0
  fi
  [[ "$health" != unhealthy && "$health" != missing ]] || { echo "Failed: $health"; exit 1; }
  sleep 5
done
echo "Healthcheck timeout"
exit 1
