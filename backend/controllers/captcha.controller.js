import svgCaptcha from 'svg-captcha';
import { signup } from './auth.controller.js';



export const getCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 2,
    ignoreChars: '0oO1ilI',
    color: true,
    background: '#f2f2f2',
  });

  req.session.captcha = captcha.text;

  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store',
  });

  res.type('svg');
  res.status(200).send(captcha.data);
};

// Replace original signup with captcha check
export const verifyCaptchaAndSignup = async (req, res, next) => {
  const userInputCaptcha = req.body.captcha;
  const sessionCaptcha = req.session?.captcha;

  if (!userInputCaptcha || userInputCaptcha !== sessionCaptcha) {
    return res.status(400).json({ success: false, message: 'Invalid CAPTCHA' });
  }

  // Remove captcha from session after use
  req.session.captcha = null;

  // Proceed with original signup logic
  return signup(req, res, next);
};
