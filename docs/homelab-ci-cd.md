# Homelab deployment (pilot: WappHub Demo)

## Pipeline
Pull request: build, Docker smoke test on /health, Compose and shell validation.
Merge to main: rebuild, smoke test and publish immutable ghcr.io/uillaneduardo/wapphub-demo:<commit SHA>.
Deployment to homelab is automatic **only after** setting repository variable HOMELAB_DEPLOY_ENABLED=true.

## First-time setup
1. Use an isolated Ubuntu VM for a GitHub Actions self-hosted runner (do not install it on the Proxmox host). Register runner label `homelab-deploy` for this repository, with controlled Docker access. Runner execution of repository scripts and Docker control is highly privileged.
2. Checkout this repo into the homelab deployment directory (for example `/home/uillan/homelab/apps/wapphub-demo`) and ensure the deployed compose.yaml is the version that uses `HOMELAB_IMAGE`.
3. Set repository Actions variables HOMELAB_COMPOSE_DIR to the actual absolute folder and HOMELAB_DEPLOY_ENABLED to true **only after** runner and registry image access are tested. Environment `production` must permit unattended deployments, if required by policy.
4. Ensure the runner account can run docker compose in that directory. Packages pulled from GHCR must be accessible to the runner via the GitHub Actions token or a read-only credential.
5. Confirm port 8280 is not in use by another application and that the existing Cloudflare routing points at 127.0.0.1:8280.

## Safety and rollback
Never run untrusted PR code on the self-hosted runner. Protect main from unreviewed commits/workflow changes. The action does not touch named volumes or call docker compose down; rollback replaces only the image, not database state. Keep Docker access restricted. Any first deployment without a previous container cannot roll back. Monitor production logs before declaring this pilot complete.
