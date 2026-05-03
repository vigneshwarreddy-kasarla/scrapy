# Docs Update Playbook

Use this checklist whenever there is a huge change.

## Trigger conditions

A huge change means at least one of:

- new backend module or major endpoint group
- migration that changes key entities/relationships
- new frontend route/page or role-access changes
- new channel work (Android/WhatsApp)
- game module or tracking architecture updates

## Mandatory update steps

1. Update `requirements-gathering.md` statuses (green/red underlined statements).
2. Update `uml-diagrams.md` (user flow + component + DB ER).
3. Update `backend-docs.md`.
4. Update `frontend-docs.md`.
5. Update this file if the update process itself changes.

## Status formatting rule (mandatory)

- Completed sentence format: `<span style="color:green"><u>Completed statement...</u></span>`
- Not completed sentence format: `<span style="color:red"><u>Pending statement...</u></span>`

## Suggested PR checklist snippet

- [ ] Requirements status updated
- [ ] UML diagrams updated
- [ ] Backend docs updated
- [ ] Frontend docs updated
- [ ] Planned vs implemented gaps re-validated
