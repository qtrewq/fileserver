# FileServer - Comprehensive Feature Specifications & UI Inventory

> [!NOTE]
> This document serves as both a feature specification and an exhaustive UI test plan. It details every interactive element, input field, and potential failure state in the application.

---

## 1. Authentication & Security (Login.jsx)

### 1.1 Login View (`mode='login'`)
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Username Input** | `text` | Enters username or email. Auto-focus. | Empty submission; Special characters; SQL injection attempts (sanitized). |
| **Password Input** | `password` | Enters password. | Empty submission; Wrong password. |
| **Sign In Button** | `submit` | POST `/token`. On success: stores JWT, redirects to `/`. | **401**: Invalid credentials.<br>**403**: Account Disabled (redirects to `/account-disabled`).<br>**423**: Account Locked (too many attempts).<br>**429**: Rate Limited (IP ban).<br>**Network**: API unreachable. |
| **Forgot Password?** | `button` | Switches mode to `forgot`. | - |
| **Sign Up Link** | `button` | Switches mode to `register`. | - |

### 1.2 Registration View (`mode='register'`)
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Username Input** | `text` | Enters desired username. Shows `/users/{username}` preview. | Duplicate username (400); Invalid chars; Spaces. |
| **Email Input** | `email` | Enters email address. | Invalid email format; Duplicate email. |
| **Password Input** | `password` | Enters password. | **Policy Violation**: < 8 chars, missing uppercase, missing special char. |
| **Confirm Password** | `password` | Re-enters password for verification. | Mismatch with Password field. |
| **Create Account** | `submit` | POST `/register`. Auto-logins on success. | **400**: Username taken.<br>**422**: Validation error.<br>**500**: DB error. |
| **Sign In Link** | `button` | Switches mode to `login`. | - |

### 1.3 Forgot Password View (`mode='forgot'`)
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Email Input** | `email` | Enter email to receive reset link. | Email not found (generic success message shown for security). |
| **Send Reset Link** | `submit` | POST `/forgot-password`. | **500**: SMTP failure (server misconfigured). |
| **Back to Login** | `button` | Switches mode to `login`. | - |

### 1.4 Account Disabled (`AccountDisabled.jsx`)
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Return to Login** | `link` | Navigates to `/`. | - |

---

## 2. Main Dashboard (Dashboard.jsx)

### 2.1 Navigation & Toolbar
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Breadcrumbs** | `nav` | Clickable path segments to navigating up hierarchy. | Deeply nested paths (overflow). |
| **Nav Menu (Burger)**| `button` | Toggles navigation dropdown. | - |
| ↳ **Home** | `button` | Navigates to `~` (user root). | - |
| ↳ **Shared with Me**| `button` | Navigates to shared items view. | Empty state handling. |
| ↳ **Users List** | `button` | (Admin Only) Navigates to other users' roots. | Authorization failure (403). |
| **Refresh Button** | `button` | Re-fetches current directory items. | Network error; Spinner stuck. |
| **View Toggle** | `button` | Switches between Grid (`LayoutGrid`) and List (`List`). | LocalStorage save failure. |
| **Size Toggle** | `button` | S/M/L - Adjusts icon/thumbnail size. | - |
| **Sort Toggle** | `button` | Name/Size/Date/Type. Double-click to reverse order. | - |
| **New Folder** | `button` | Opens `New Folder` modal. Permissions: `can_create_folders`. | Permission denied. |
| **Upload Files** | `button` | Triggers hidden file input for multi-file upload. | **413**: File too large.<br>**400**: Quota exceeded.<br>**400**: Disallowed file type. |
| **Upload Folder** | `button` | Triggers hidden input (`webkitdirectory`) for folder upload. | Recursion limits; Empty folders. |
| **User Profile** | `button` | Opens `Account Settings` modal. | - |
| **Admin Panel** | `link` | (Admin Only) Navigates to `/admin`. | - |
| **Logout** | `button` | Clears token, redirects to `/login`. | - |

### 2.2 File Grid / List Items
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **File Icon/Thumb** | `div` | Click: Previews file. Right-Click: Context Menu. | Image load error (fallback icon). |
| **Folder Icon** | `div` | Click: Navigates into folder. | Access denied (restricted folder). |
| **Hover Actions** | `overlay` | (Desktop) Download, Share, Delete buttons appear on hover. | Touch devices (uses context menu instead). |
| **Context Monitor**| `listener`| Right-click on item opens custom Context Menu. | Off-screen rendering (clipping). |

### 2.3 Context Menu (Popup)
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Edit** | `button` | Opens Code Editor (if text-based). | File locked; Content load error. |
| **Download** | `button` | GET `/files/...` (blob). Triggers browser download. | Network interrupt; 404 (file executed elsewhere). |
| **Share** | `button` | Opens Share Modal. Permission: `can_share`. | - |
| **Delete** | `button` | Opens confirmation, then DELETE `/files/...`. Permission: `can_delete`. | File locked; Permission denied. |
| **Rename** | `button` | Opens Rename Modal. Permission: `can_upload` + `can_delete`. | Name collision (409); Invalid chars. |

### 2.4 Modals
#### New Folder Modal
- [ ] **Name Input**: Text. Validates for slashes/nulls.
- [ ] **Create Button**: POST `/mkdir`. Fails if folder exists.
- [ ] **Cancel**: Closes modal.

#### Rename Modal
- [ ] **New Name Input**: Text. Auto-populated with current name.
- [ ] **Rename Button**: POST `/rename`. Fails if target exists (409) or invalid path.

#### Share Modal
- [ ] **Username Input**: Text (with Datalist autocomplete). Fails if user not found.
- [ ] **Permission Select**: Dropdown [Read Only / Read & Write].
- [ ] **Share Button**: POST `/share`.

#### Password Change Modal (Forced or Voluntary)
- [ ] **Current Password**: Input. Required for verification.
- [ ] **New Password**: Input.
- [ ] **Confirm Password**: Input. Must match.
- [ ] **Update Button**: POST `/change-password`.

---

## 3. Collaborative Code Editor (CodeEditor.jsx)

### 3.1 Editor Toolbar
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Run Button** | `button` | (Python Only) POST `/python/run`. Executes code backend. | Execution timeout; Syntax error; Library missing. |
| **Save Button** | `button` | POST `/save-file`. Manual trigger. | Disk full; Permission denied; Version conflict. |
| **Close (X)** | `button` | Closes editor, cleans up WebSocket/Python session. | Unsaved changes (autosave triggers). |
| **Active Users** | `badge` | Lists connected WebSocket users. | Sync delay. |

### 3.2 Editing Area
- [ ] **Text Area**: `textarea` (transparent). Captures input. Warning: Large files (performance).
- [ ] **Syntax Layer**: `ReactSyntaxHighlighter`. Renders colored code behind text area.
- [ ] **Cursor Layer**: Canvas overlay. Renders remote users' cursors (color-coded).
- [ ] **Auto-Save**: `useEffect`. Triggers 1s after last keystroke. Flashes "Saving...".

### 3.3 Terminal Output
- [ ] **Output Panel**: Pre-formatted text block. Shows stdout/stderr from Python.
- [ ] **Close Terminal**: Button. Hides panel.

---

## 4. Admin Dashboard (Admin.jsx)

### 4.1 Users Management Tab
#### Create User Form
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Username** | `input` | New username. | Duplicate. |
| **Password** | `input` | Initial password. | Complexity policy. |
| **Root Path** | `input` | File isolation path (default `/`). | Path traversal injection attempts. |
| **Groups** | `checkboxes`| Assigns membership. | - |
| **Require Pwd Change**|`checkbox`| Flags `require_password_change=True`. | - |
| **Create Button** | `submit` | POST `/users`. | - |

#### User List Table
- [ ] **Inline Edit (Username)**: Input. Enter to save.
- [ ] **Inline Edit (Root Path)**: Input. Enter to save.
- [ ] **Quick Toggle (Admins)**: Badges.
- [ ] **Reset Password (Key)**: Opens modal to force-set new password.
- [ ] **Delete User (Trash)**: DELETE `/users/{id}`. Confirmation required.

### 4.2 Groups Management Tab
#### Create Group Form
- [ ] **Group Name**: Input.
- [ ] **Add Button**: POST `/groups`.

#### Edit Group Modal (Complex)
- [ ] **Description**: Text.
- [ ] **Default Perm**: Dropdown [None/Read/Write/Admin].
- [ ] **Capabilities**: Checkboxes (Upload, Download, Delete, Share, Create Folders).
- [ ] **Storage Quota**: Number (bytes). Null = Unlimited.
- [ ] **File Types**: Text (csv extensions). Null = All.
- [ ] **Folder Restrictions**:
    - [ ] **Restrict Toggle**: Boolean. If true, user is locked out of root except for:
    - [ ] **Added Folder Path**: Input.
    - [ ] **Added Folder Perm**: Dropdown.
    - [ ] **Add Path Button**: Push to local state array.
    - [ ] **Remove Path Button**: specific item delete.
- [ ] **Save Group**: PUT `/groups/{name}`.

### 4.3 Server Settings Tab (ServerSettings.jsx)
#### Server
- [ ] **Port**: Number.
- [ ] **Host**: Text (IP).
- [ ] **Public URL**: Text.
- [ ] **Reload**: Checkbox.

#### Security
- [ ] **Max File Size**: Number (MB).
- [ ] **Total Upload Batch**: Number (MB).
- [ ] **Allowed Origins**: Text (CORS).
- [ ] **Session Timeout**: Number (Minutes).

#### Storage
- [ ] **Root Path**: Text. *Critical*: Changing this moves the data source.

#### Features (Toggles)
- [ ] **Enable Sharing**: Checkbox.
- [ ] **Enable Collaboration**: Checkbox.
- [ ] **Enable Python**: Checkbox.

#### Limits
- [ ] **Max Users**: Number.
- [ ] **Max Groups**: Number.
- [ ] **Concurrent Conns**: Number.

#### Email
- [ ] **Enable Email**: Checkbox.
- [ ] **Mode**: Select [Relay, Gmail, Direct].
- [ ] **Host/Port/User/Pass**: Inputs (Conditional based on Mode).
- [ ] **Use TLS**: Checkbox.
- [ ] **Save Config**: PUT `/config`. Writes to `config.json`.
- [ ] **Reset Config**: Button. Restores defaults.

---

## 5. Account Settings (AccountSettings.jsx)

### 5.1 Profile Form
| Element | Type | Action / Logic | Failure Modes / Edge Cases |
| :--- | :--- | :--- | :--- |
| **Username** | `input` | Change username. | Taken; Invalid chars. |
| **Email** | `input` | Change email. | Invalid format. |
| **Current Password** | `input` | Verify identity. | Incorrect password (blocks save). |
| **New Password** | `input` | Optional. | Mismatch with Confirm. |
| **Confirm Password** | `input` | Optional. | Mismatch. |
| **Save Changes** | `submit` | PUT `/account/settings`. Refreshes token if username changed. | - |

---

## 6. Technical Specifications

### 6.1 Backend Stack
*   **Framework**: FastAPI (Async)
*   **Database**: SQLAlchemy (SQLite default, PostgreSQL compatible)
*   **Auth**: OAuth2 w/ Password Flow + JWT (HS256)
*   **Real-time**: Starlette WebSockets

### 6.2 Frontend Stack
*   **Framework**: React 18 (Vite)
*   **Styling**: TailwindCSS (Dark Mode Default)
*   **Icons**: Lucide React
*   **Editor**: `react-syntax-highlighter` + Custom Overlay
*   **HTTP**: Axios (w/ Interceptors)

### 6.3 Security Defenses
*   **Path Traversal**: Strict validation via `get_safe_path` (resolves `..`).
*   **Rate Limiting**: In-memory tracking (Login: 5 attempts/15min).
*   **Password Hashing**: `bcrypt` (Passlib).
*   **RBAC**: Group-based permission aggregation (Additive rights).
