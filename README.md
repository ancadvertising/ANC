# ANC Marketing Agency ERP

نظام ERP/CRM لوكالة ANC Advertising، بواجهة PWA عربية مستضافة على Cloudflare Pages وواجهة API على Cloudflare Workers مع D1 وR2 وDurable Objects.

## الإصدار 3.1.0

- عرض اسم العميل والمشروع في الفواتير والمدفوعات.
- إنشاء فاتورة تلقائيًا من البنود غير المفوترة داخل مشروع محدد دون مضاعفة رصيد العميل.
- PDF احترافي بهوية ANC يدعم العربية ويحفظ في R2 ويظهر في مستندات العميل.
- إدارة المستخدمين: إنشاء، تعديل، تفعيل/تعطيل، حذف آمن، وصلاحيات تفصيلية.
- صفحة إعدادات فعلية لهوية الشركة والفواتير والضريبة وشروط الدفع وإعدادات الإعلانات.
- تعديل وأرشفة واستعادة الإعلانات مع الاحتفاظ بالحركات المالية وسجل المراجعة.
- مركز مستندات مرتبط بالعميل والمشروع مع نطاق داخلي أو ظاهر للعميل.
- توحيد جميع مسارات Pages على غلاف SPA واحد لمنع الصفحات البيضاء.

## البنية

- `frontend/`: واجهة Cloudflare Pages وPWA.
- `worker/`: Cloudflare Worker وD1 migrations ومولد PDF.
- `worker/migrations/`: تغييرات قاعدة البيانات المرتبة.
- `worker/tests/`: اختبارات المنطق والمسارات وPDF.

## الاختبار

```powershell
npm.cmd --prefix worker test
wrangler deploy --dry-run --config worker/wrangler.jsonc
```

## النشر

طبّق migrations بعد نسخة D1 احتياطية، ثم انشر Worker، ثم انشر مجلد `frontend` إلى مشروع Pages `anc-marketing-erp`.

الموقع: https://anc-marketing-erp.pages.dev

واجهة API: https://anc-marketing-erp-api.anc-advertising.workers.dev