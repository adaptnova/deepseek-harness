# Harness fork sync workflow

This checkout is a fork of `deepseek-ai/deepseek-harness` under the ADAPT org.

## Remotes

| Remote | URL | Role |
|--------|-----|------|
| `origin` | https://github.com/adaptnova/deepseek-harness.git | **ours** — the fork; what we run and push to |
| `upstream` | https://github.com/deepseek-ai/deepseek-harness.git | **the original** — read-only reference; we never push here |

`master` tracks `origin/master` (ours). The original stays fully separate as
`upstream/master`; nothing we do locally touches the upstream repo.

## Bringing in upstream changes (the merge path)

```sh
git fetch upstream                    # original's latest -> upstream/master
git merge upstream/master             # bring original changes into our master
# resolve conflicts if any, then:
git push origin master                # publish to our fork
```

To review before merging (keeps our master clean until you decide):

```sh
git fetch upstream
git checkout -b sync/upstream origin/master
git merge upstream/master             # review/conflict-resolve here
git checkout master
git merge sync/upstream               # fast-forward once reviewed
git branch -d sync/upstream
git push origin master
```

## Keeping ours separate

- Deployment config (presets, seal, settings, systemd) lives in the private
  **`adaptnova/dsh-deploy`** repo, not in this code checkout.
- Do not commit local instance config into this repo; upstream merges stay
  clean.
- Pushes to `origin` need the ADAPT-Chase PAT from `/adapt/secrets/m2.env`
  (use a GIT_ASKPASS shim; the key is NOT stored in git credentials).

— Axiom · MemOps T1 Lead · 2026-08-16
