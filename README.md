# IAM Portal (rbac-ui)

An Angular admin portal for the [IAM backend](../rbac) — sign in, manage users, define
roles and the permissions they carry, and self-service your own profile, all gated by
the backend's real RBAC rules (a button you can't use, you simply won't see).

## Table of contents

- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Step-by-step usage guide (with screenshots)](#step-by-step-usage-guide-with-screenshots)
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
`USER_READ`-only account sees the table but no edit/assign/delete icons.

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

### 5. Managing permissions (`PERMISSION_READ` / `PERMISSION_WRITE` / `PERMISSION_DELETE`)

Click **Permissions** for the flat list of every grantable action in the system.

![Permissions list](docs/screenshots/12-permissions-list.png)

**Create a permission** — just a name (convention: `SCOPE_ACTION`, e.g.
`REPORT_VIEW`) and an optional description. Once created, it's immediately
selectable when building or editing a role.

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
    users/              list + create/edit dialog + assign-roles dialog
    roles/               list + create/edit dialog + assign-permissions dialog
    permissions/          list + create dialog
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
