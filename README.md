# IAM Portal (rbac-ui)

An Angular admin portal for the [IAM backend](../rbac) — sign in, manage users, define
roles and the permissions they carry, and self-service your own profile, all gated by
the backend's real RBAC rules (a button you can't use, you simply won't see).

## Table of contents

- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Step-by-step usage guide (with screenshots)](#step-by-step-usage-guide-with-screenshots)
- [Master Admin & Projects](#master-admin--projects)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Available scripts](#available-scripts)
- [Building for production](#building-for-production)
- [Configuration reference](#configuration-reference)

## Stack

- Angular 19 (standalone components, signals, the `@if`/`@for` control-flow syntax)
- Angular Material 19 with a custom **Material 3 "Blue"** theme (token-based `mat.theme()`
  theming, not a prebuilt Material 2 theme)
- Self-hosted Roboto + Material Icons fonts (`public/fonts`) — no external font CDN at runtime
- RxJS, reactive forms
- Talks to the [Spring Boot IAM backend](../rbac) over its REST API

## Prerequisites

- Node.js 22.11+ and npm
- The [IAM backend](../rbac) running and reachable (see its README for setup —
  Docker Compose is the fastest path)

## Setup

```bash
git clone <this-repo>
cd rbac-ui
npm install
npm start
```

This runs `ng serve` on `http://localhost:4200`. A dev-server proxy
(`proxy.conf.json`) forwards any request to `/api/*` to `http://localhost:8080`
(where the backend runs by default), so **no CORS configuration is needed** for
local development — the browser only ever talks to `localhost:4200`.

If your backend runs somewhere else, edit `proxy.conf.json`'s `target`.

Sign in with the backend's seeded admin account to get full access immediately:

```
username: admin
password: Admin@12345
```

(Change this password from **My profile** once you're in — see the guide below.)

## Step-by-step usage guide (with screenshots)

### 1. Sign in

Open `http://localhost:4200` — you're redirected to **/login**. Enter your
username and password and click **Sign in**.

![Login page](docs/screenshots/01-login.png)

Don't have an account yet? Click **Create one** to self-register — this always
grants the baseline `USER` role (no permissions), matching the backend's
`POST /api/auth/register` behavior.

![Register page](docs/screenshots/02-register.png)

### 2. The dashboard

After signing in you land on **/dashboard**: a welcome card with your account and
roles, plus quick-link cards to the sections you have access to. Signed in as
`admin` (who holds every permission via the seeded `ADMIN` role), all four
sections are visible:

![Dashboard as admin](docs/screenshots/03-dashboard-admin.png)

If your account is a platform **Master Admin**, a teal **Master Admin** badge
appears at the top of the sidenav — see
[Master Admin & Projects](#master-admin--projects) below.

![Dashboard with the Master Admin badge](docs/screenshots/18-dashboard-master-admin-badge.png)

The sidenav on the left is itself permission-gated — **Users**, **Roles** and
**Permissions** links only render if you hold the corresponding `*_READ`
authority (`*appHasPermission` directive). A plain `USER` account sees only
**Dashboard** and **My profile**:

![Dashboard as a plain user — fewer nav items](docs/screenshots/16-dashboard-plain-user.png)

### 3. Managing users (`USER_READ` to view, `USER_WRITE`/`USER_DELETE` to act)

Click **Users** in the sidenav for a paginated, sortable table of every account:
username, email, name, roles (as chips), and status (Active / Disabled / Locked).

![Users list](docs/screenshots/04-users-list.png)

**Create a user** — click **New user** to open the create dialog: username,
email, password, optional name, and an optional role multi-select (defaults to
`USER` if left empty, same as the backend).

![Create user dialog](docs/screenshots/05-users-create-dialog.png)

**Assign roles** — click the shield icon on a row to replace that user's entire
role set. This calls `PUT /api/users/{id}/roles`, and thanks to the backend's
cache-eviction-on-write design, the change is enforced on that user's *very
next request* — not after some delay.

![Assign roles dialog](docs/screenshots/06-users-assign-roles-dialog.png)

**Edit a user** — click the pencil icon to update email, first/last name, or
toggle **Account enabled** / **Account not locked** (an admin kill-switch for
an account, independent of deleting it).

![Edit user dialog](docs/screenshots/07-users-edit-dialog.png)

**Delete a user** — click the trash icon; every destructive action in the
portal asks for confirmation first.

![Delete user confirmation](docs/screenshots/08-users-delete-confirm.png)

Each action button only appears if you hold the permission it needs — a
`USER_READ`-only account sees the table but no edit/assign/delete icons. A
**Master Admin** additionally sees a shield toggle icon on every row to
promote or revoke that user's own Master Admin status — see
[Master Admin & Projects](#master-admin--projects).

![Users list with the Master Admin toggle](docs/screenshots/24-users-master-admin-toggle.png)

### 4. Managing roles (`ROLE_READ` / `ROLE_WRITE` / `ROLE_DELETE`)

Click **Roles** for the full role list, each with its description and the
permissions it currently grants.

![Roles list](docs/screenshots/09-roles-list.png)

**Create a role** — name, optional description, and an optional permission
multi-select to grant it immediately.

![Create role dialog](docs/screenshots/10-roles-create-dialog.png)

**Manage permissions** — click the key icon on a role to replace its entire
permission set. Because this changes what *every user holding that role* can
do, the backend clears its authorization cache on this write — again, no
waiting for a TTL to expire.

![Assign permissions dialog](docs/screenshots/11-roles-assign-permissions-dialog.png)

**Locked roles** (a small lock icon next to the name — the seeded `ADMIN` and
`SUPER_ADMIN`, and any role a Master Admin created) can only be edited,
re-permissioned or deleted by a Master Admin, even by someone else holding
`ROLE_WRITE`/`ROLE_DELETE`. A Master Admin sees the usual action icons on
every row regardless of lock state; anyone else sees a plain **Locked** label
in place of the icons for those rows — the UI mirrors the backend's
`RoleService.requireEditable` check exactly, so there's never a button that
looks clickable but 403s.

![Roles list with locked-role indicator](docs/screenshots/23-roles-lock-indicator.png)

![Locked roles as seen by a non-Master-Admin holding ROLE_WRITE](docs/screenshots/25-roles-locked-non-master-admin.png)

### 5. Managing permissions (`PERMISSION_READ` to view, `MASTER_ADMIN` to create/delete)

Click **Permissions** for the flat list of every grantable action in the system.

![Permissions list](docs/screenshots/12-permissions-list.png)

**Create a permission** — just a name (convention: `SCOPE_ACTION`, e.g.
`REPORT_VIEW`) and an optional description. Once created, it's immediately
selectable when building or editing a role. Creating and deleting permissions
is **Master-Admin-only** — the catalog of what a role can even grant is
platform-level, not something an ordinary `PERMISSION_WRITE` holder can
expand, so the **New permission** button and the row delete icons only render
for a Master Admin.

![Create permission dialog](docs/screenshots/13-permissions-create-dialog.png)

### 6. Your own profile and password

Click **My profile** (sidenav, or the user menu in the top-right) to see your
account details and change your own password. This works for every signed-in
user regardless of permissions — it's self-service, not admin-only.

![Profile page](docs/screenshots/14-profile.png)

Changing your password revokes your other active sessions (refresh tokens),
matching the backend's behavior.

### 7. Signing out

Click your name in the top-right toolbar to open the user menu — **My profile**
or **Sign out**.

![User menu](docs/screenshots/15-user-menu.png)

### 8. What happens if you lack a permission

Routes are also guarded client-side, mirroring the backend: navigating
directly to a URL you don't have the authority for (e.g. a `USER`-only account
hitting `/permissions`) redirects to a clear **Access denied** page rather than
a blank screen or a failed API call.

![Access denied page](docs/screenshots/17-forbidden-page.png)

## Master Admin & Projects

Mirrors the backend's multi-tenant hierarchy (see the
[backend README](../rbac#master-admin--projects) for the full design):

```
Master Admin (platform-level, not a Role — a flag on User)
   └─ creates permissions, locked roles, and Projects
      └─ each Project has one or more Super Admins (assigned only by a Master Admin)
         └─ a Super Admin adds other users to their project on any existing role
```

`AuthService.isMasterAdmin` reads a literal `MASTER_ADMIN` authority straight
out of the decoded JWT (same no-extra-request pattern as every other
authority check in this app), and the `*appHasPermission="'MASTER_ADMIN'"`
directive gates every Master-Admin-only control the same way `USER_WRITE` or
`ROLE_DELETE` do elsewhere in the portal.

### Projects (new nav item, no route guard — the backend scopes visibility)

Click **Projects** for the list of tenants. A Master Admin sees every
project; anyone else sees only the projects where they hold a membership —
the list itself needs no client-side gating because `GET /api/projects`
already returns exactly the caller's visible set, so the page has no
`permissionGuard` (unlike `/users`, `/roles`, `/permissions`).

![Projects list](docs/screenshots/19-projects-list.png)

**A non-Master-Admin doesn't see this "all projects" browser at all.** The
sidenav's brand area (top-left, normally "IAM Portal") instead shows the name
of their own project — `ShellComponent` calls `GET /api/projects` (already
scoped to the caller) on load, and swaps the brand label for it when the
signed-in user isn't a Master Admin, dropping the standalone **Projects** nav
link entirely. If that project's the one they're a `SUPER_ADMIN` of, the
brand becomes a direct link straight into its member page — no detour through
a list of tenants they have no reason to browse.

![A Super Admin's sidenav: their project's name replaces "IAM Portal", no Projects link](docs/screenshots/26-super-admin-project-brand.png)

**Create/edit a project** — Master-Admin-only (`New project`, the edit
pencil, and delete are all gated `*appHasPermission="'MASTER_ADMIN'"`): a
name and optional description.

![Create project dialog](docs/screenshots/20-project-create-dialog.png)

**Manage members** — click the group icon (visible to a Master Admin, or to
that project's own `SUPER_ADMIN`) to open the project's member list: each
member's username, email, and the roles they hold *within this project*
(from the same global role catalog as everywhere else — roles aren't
project-specific, only the assignment is).

![Project members page](docs/screenshots/21-project-members.png)

**Add a member** — pick any user who isn't already on the project and one or
more roles to grant them. The role multi-select filters out `SUPER_ADMIN`
unless you're a Master Admin, matching the backend rule that only a Master
Admin can mint a project's Super Admin — a project's own Super Admin can add
managers, reporters, editors, or any other existing role, but never a peer
Super Admin.

![Add project member dialog](docs/screenshots/22-add-project-member-dialog.png)

The user picker is powered by `ProjectService.listCandidateUsers`
(`GET /api/projects/{id}/candidate-users`), **not** the global user list —
deliberately: a real Super Admin holds no `USER_READ` authority (that stays a
Master Admin/legacy-`ADMIN` affair), so reusing `UserService.list()` here
would 403 for exactly the person this dialog is for. This endpoint returns
only the minimal `{id, username, email}` of users not yet on the project,
gated the same as adding a member rather than requiring global user access.

![Picking a candidate user as a real Super Admin, no global USER_READ held](docs/screenshots/28-add-member-candidate-users.png)

**Assign roles / remove a member** work the same way — the assign-roles
dialog keeps `SUPER_ADMIN` visible (never silently dropping it) if the member
already holds it, but still only a Master Admin can add or remove it; removing
a `SUPER_ADMIN` member is likewise Master-Admin-only (including removing
*themselves* — a Super Admin can't demote or remove their own row).

### Promoting or revoking a Master Admin

Only an existing Master Admin can create another one. On the **Users** page,
a Master Admin sees a shield icon on every row (`*appHasPermission="'MASTER_ADMIN'"`)
that calls `PATCH /api/users/{id}/master-admin` after a confirmation dialog —
there's no separate "Master Admin" role to assign via the usual roles UI,
since it's deliberately a flag on the account, not a row in the role catalog.

## Project structure

```
src/app/
  core/
    models/          TypeScript interfaces mirroring the backend's DTOs
    services/         AuthService, UserService, RoleService, PermissionService,
                       TokenStorageService, NotificationService, jwt.util
    interceptors/      authInterceptor (attach token, refresh-and-retry on 401),
                       errorInterceptor (snackbar on failures)
    guards/            authGuard, permissionGuard
    directives/        HasPermissionDirective (*appHasPermission)
  layout/
    shell/             toolbar + permission-gated sidenav + router-outlet
  features/
    auth/              login, register
    dashboard/
    users/              list + create/edit dialog + assign-roles dialog + master-admin toggle
    roles/               list (with locked-role indicator) + create/edit dialog + assign-permissions dialog
    permissions/          list + create dialog (Master-Admin-only)
    projects/              list + create/edit dialog + members page + add-member/assign-roles dialogs
    profile/             view self + change password
    errors/               forbidden, not-found
  shared/
    confirm-dialog/     reusable destructive-action confirmation

public/fonts/            self-hosted Roboto + Material Icons woff2 files
proxy.conf.json           dev-server proxy: /api -> http://localhost:8080
```

## Architecture notes

**Session state** lives in `AuthService` as Angular signals: `isAuthenticated`,
`authorities` (decoded straight from the JWT's `authorities` claim — see the
backend's `JwtService`, which embeds it for exactly this no-extra-request use
case), and the full `user` profile (fetched once via `GET /api/users/me`).

**Route guards** (`authGuard`, `permissionGuard`) and the `*appHasPermission`
structural directive all read from those same signals, so the sidenav, page
guards, and individual action buttons stay consistent automatically — there's
one source of truth for "what can this user do right now."

**Token refresh** is handled entirely in `authInterceptor`: a 401 from any
protected endpoint triggers exactly one shared refresh call (concurrent 401s
are coalesced, not each firing their own refresh), and the original request is
retried transparently. A 401 from the refresh call itself clears the session
and redirects to `/login` — there's no retry loop.

**Errors** surface two ways: `errorInterceptor` shows a snackbar for any failed
request (except 401s, since those already redirect), and forms additionally
read the backend's structured `ErrorResponse` (`message`, `fieldErrors`) to
show inline messages — see the backend's README for that shape.

## Available scripts

```bash
npm start        # ng serve with the dev proxy, http://localhost:4200
npm run build    # production build to dist/rbac-ui
npm run watch    # dev build in watch mode, no server
npm test         # unit tests (Karma/Jasmine)
```

## Building for production

```bash
npm run build
```

Output goes to `dist/rbac-ui/browser`. It's a static SPA — serve it with any
static file server / CDN, with a rewrite so unknown paths fall back to
`index.html` (standard SPA hosting), and a reverse proxy forwarding `/api` to
the backend (matching the `apiBaseUrl: '/api'` default in
`src/environments/environment.ts` — override it there if the backend lives on
a different origin than the one serving this app).

## Configuration reference

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Production `apiBaseUrl` (default: relative `/api`) |
| `src/environments/environment.development.ts` | Dev `apiBaseUrl` (proxied, see below) |
| `proxy.conf.json` | `ng serve` dev proxy target for `/api/*` |
| `src/styles.scss` | Global styles + the Material 3 theme definition |

To point the dev server at a backend that isn't on `localhost:8080`, edit
`proxy.conf.json`'s `target`. To point a *production build* at a backend on a
different origin than the one hosting this app, change `apiBaseUrl` in
`environment.ts` to an absolute URL and ensure the backend's
`CORS_ALLOWED_ORIGINS` includes this app's origin (see the backend README).
