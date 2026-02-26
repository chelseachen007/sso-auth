/**
 * 自动注册所有 Web Components
 *
 * 在 HTML 中直接引入此文件即可使用所有组件：
 * <script type="module" src="https://unpkg.com/@sso-auth/components/dist/define.js"></script>
 */

// Provider
import './sso-provider.js';

// Login
import './login/sso-login.js';

// Register
import './register/sso-register.js';

// Profile
import './profile/sso-profile.js';
import './profile/sso-password.js';

// Sessions
import './sessions/sso-sessions.js';

// Applications
import './applications/sso-app-list.js';
import './applications/sso-app-form.js';

console.log('@sso-auth/components loaded. Available components:');
console.log('  - <sso-provider>');
console.log('  - <sso-login>');
console.log('  - <sso-register>');
console.log('  - <sso-profile>');
console.log('  - <sso-password>');
console.log('  - <sso-sessions>');
console.log('  - <sso-app-list>');
console.log('  - <sso-app-form>');
