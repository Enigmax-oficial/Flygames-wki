const fs = require('fs');

const replaceInFile = (file, replacer) => {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
};

// 1. main.tsx
replaceInFile('src/main.tsx', content => {
  content = content.replace(
    /import App from '\.\/App\.tsx';/,
    "import { GoogleOAuthProvider } from '@react-oauth/google';\nimport App from './App.tsx';"
  );
  content = content.replace(
    /<StrictMode>\s*<App \/>\s*<\/StrictMode>/,
    "<StrictMode>\n    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com'}>\n      <App />\n    </GoogleOAuthProvider>\n  </StrictMode>"
  );
  return content;
});

// 2. LoginModal.tsx
replaceInFile('src/components/LoginModal.tsx', content => {
  // We need to replace the Google button and the function
  // We'll import GoogleLogin from '@react-oauth/google' and jwt_decode
  
  if (!content.includes('@react-oauth/google')) {
    content = content.replace(
      /import \{ auth, googleAuthProvider \} from '\.\.\/lib\/firebase';/,
      "import { auth, googleAuthProvider } from '../lib/firebase';\nimport { GoogleLogin } from '@react-oauth/google';\nimport { jwtDecode } from 'jwt-decode';"
    );
  }

  // Remove handleGoogleLogin
  content = content.replace(/const handleGoogleLogin = async \(\) => \{[\s\S]*?\} finally \{\n\s*setLoading\(false\);\n\s*\}\n\s*\};\n/, '');

  // Replace the custom Google button with the GoogleLogin component
  const googleBtnRegex = /<button\s*type="button"\s*onClick=\{handleGoogleLogin\}[\s\S]*?<\/button>/;
  content = content.replace(googleBtnRegex, `
              <div className="flex justify-center w-full bg-white rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      const decoded = jwtDecode(credentialResponse.credential) as any;
                      const userName = decoded.name || decoded.email.split('@')[0];
                      const userEmailVal = decoded.email;
                      setAuthMethod('Google Identity Services');
                      setSuccess(true);
                      setTimeout(() => {
                        onLoginSuccess(userName, userEmailVal);
                        setSuccess(false);
                        onClose();
                      }, 800);
                    }
                  }}
                  onError={() => {
                    setErrorMessage('Google Sign-In failed');
                  }}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
  `.trim());

  return content;
});

