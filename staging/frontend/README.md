# ANC ERP - Staging Frontend

واجهة منفصلة عن Google Apps Script، مخصصة للاختبار على Cloudflare Pages قبل دمج أي تحديث في الموقع الرسمي.

## الحدود الحالية

- الواجهة تعمل كتطبيق PWA قابل للتثبيت.
- التنقل داخلي ولا يعتمد على روابط `googleusercontent` أو `?page=`.
- العملاء والمشروعات يعملان كتجربة UX محلية محفوظة في متصفح الجهاز.
- لا توجد أي كتابة إلى Google Sheets في هذه المرحلة.
- Apps Script سيظل مسؤولًا عن منطق الأعمال والبيانات بعد توصيل API الآمن.

## المعاينة المحلية

يمكن تقديم هذا المجلد بأي خادم ملفات ثابت. لا تفتح `index.html` مباشرة عبر `file://` لأن Service Worker يحتاج HTTP أو HTTPS.

## Cloudflare Pages Staging

أنشئ مشروع Pages تجريبيًا منفصلًا ومتصلًا بفرع `staging` في مستودع `ancadvertising/ANC`:

- Framework preset: None
- Root directory: `staging/frontend`
- Build command: اتركه فارغًا
- Build output directory: `.`
- Production branch للمشروع التجريبي: `staging`

لا تغيّر إعدادات مشروع الإنتاج الحالي قبل نجاح اختبارات النسخة التجريبية.

## التوصيل القادم

سنضيف طبقة API في نفس المصدر تتعامل مع Apps Script Deployment تجريبي وقاعدة بيانات Sheets منفصلة، ثم نضيف Google Identity مع التحقق من البريد والصلاحيات في الخادم.
