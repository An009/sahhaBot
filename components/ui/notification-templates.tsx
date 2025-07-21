'use client';

import { type Language } from '@/lib/i18n';

export interface EmailNotificationTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface SMSNotificationTemplate {
  message: string;
  maxLength: number;
}

export function getEmailNotificationTemplate(
  language: Language,
  patientName?: string,
  severity: 'low' | 'moderate' | 'high' | 'emergency' = 'moderate'
): EmailNotificationTemplate {
  const name = patientName || (language === 'ar' || language === 'da' ? 'المريض الكريم' : 
                              language === 'fr' ? 'Cher patient' : 'Dear Patient');

  switch (language) {
    case 'ar':
      return {
        subject: 'تم إكمال تحليل الأعراض الطبية - صحة بوت',
        htmlBody: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تحليل الأعراض جاهز</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; direction: rtl; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #5585b5 0%, #142d4c 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 10px 0; }
              .status-moderate { background-color: #dbeafe; color: #1e40af; }
              .status-high { background-color: #fed7aa; color: #c2410c; }
              .status-low { background-color: #dcfce7; color: #166534; }
              .cta-button { display: inline-block; background: #5585b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .disclaimer { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #64748b; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>صحة بوت</h1>
                <p>تحليل الأعراض الطبية</p>
              </div>
              <div class="content">
                <h2>مرحباً ${name}</h2>
                <p>تم إكمال تحليل الأعراض التي قدمتها بنجاح. النتائج جاهزة الآن للمراجعة.</p>
                
                <div class="status-badge status-${severity}">
                  ${severity === 'high' ? 'مستوى عالي من الأهمية' : 
                    severity === 'moderate' ? 'مستوى متوسط من الأهمية' : 
                    'مستوى منخفض من الأهمية'}
                </div>
                
                <p><strong>ما يمكنك توقعه:</strong></p>
                <ul>
                  <li>تحليل مفصل للأعراض المقدمة</li>
                  <li>الحالات المحتملة والتوصيات</li>
                  <li>إرشادات حول الخطوات التالية</li>
                  <li>معلومات حول متى تطلب المساعدة الطبية</li>
                </ul>
                
                <a href="#" class="cta-button">عرض النتائج الكاملة</a>
                
                <div class="disclaimer">
                  <strong>تنبيه طبي مهم:</strong> هذا التحليل للأغراض الإعلامية فقط وليس بديلاً عن الاستشارة الطبية المهنية. في حالة الطوارئ، اتصل بـ 150 فوراً.
                </div>
              </div>
              <div class="footer">
                <p>صحة بوت - مساعدك الطبي الذكي</p>
                <p>هذه رسالة آلية، يرجى عدم الرد عليها</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textBody: `
مرحباً ${name}

تم إكمال تحليل الأعراض الطبية بنجاح!

النتائج جاهزة الآن للمراجعة وتتضمن:
- تحليل مفصل للأعراض
- الحالات المحتملة والتوصيات
- إرشادات الخطوات التالية

مستوى الأهمية: ${severity === 'high' ? 'عالي' : severity === 'moderate' ? 'متوسط' : 'منخفض'}

للوصول إلى النتائج الكاملة، قم بزيارة التطبيق.

تنبيه مهم: هذا التحليل للأغراض الإعلامية فقط. في حالة الطوارئ، اتصل بـ 150.

صحة بوت - مساعدك الطبي الذكي
        `
      };

    case 'fr':
      return {
        subject: 'Analyse médicale des symptômes terminée - SahhaBot',
        htmlBody: `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Analyse des symptômes prête</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #5585b5 0%, #142d4c 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 10px 0; }
              .status-moderate { background-color: #dbeafe; color: #1e40af; }
              .status-high { background-color: #fed7aa; color: #c2410c; }
              .status-low { background-color: #dcfce7; color: #166534; }
              .cta-button { display: inline-block; background: #5585b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .disclaimer { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #64748b; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SahhaBot</h1>
                <p>Analyse médicale des symptômes</p>
              </div>
              <div class="content">
                <h2>Bonjour ${name}</h2>
                <p>Votre analyse des symptômes a été complétée avec succès. Les résultats sont maintenant prêts à être consultés.</p>
                
                <div class="status-badge status-${severity}">
                  ${severity === 'high' ? 'Niveau d\'urgence élevé' : 
                    severity === 'moderate' ? 'Niveau d\'urgence modéré' : 
                    'Niveau d\'urgence faible'}
                </div>
                
                <p><strong>Ce que vous trouverez :</strong></p>
                <ul>
                  <li>Analyse détaillée de vos symptômes</li>
                  <li>Conditions possibles et recommandations</li>
                  <li>Conseils sur les prochaines étapes</li>
                  <li>Informations sur quand consulter un médecin</li>
                </ul>
                
                <a href="#" class="cta-button">Voir les résultats complets</a>
                
                <div class="disclaimer">
                  <strong>Avertissement médical important :</strong> Cette analyse est à des fins informatives uniquement et ne remplace pas un avis médical professionnel. En cas d'urgence, appelez le 150 immédiatement.
                </div>
              </div>
              <div class="footer">
                <p>SahhaBot - Votre assistant médical intelligent</p>
                <p>Ceci est un message automatique, veuillez ne pas y répondre</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textBody: `
Bonjour ${name}

Votre analyse médicale des symptômes est terminée !

Les résultats sont maintenant disponibles et incluent :
- Analyse détaillée des symptômes
- Conditions possibles et recommandations
- Conseils sur les prochaines étapes

Niveau d'urgence : ${severity === 'high' ? 'Élevé' : severity === 'moderate' ? 'Modéré' : 'Faible'}

Pour accéder aux résultats complets, visitez l'application.

Avertissement important : Cette analyse est à des fins informatives uniquement. En cas d'urgence, appelez le 150.

SahhaBot - Votre assistant médical intelligent
        `
      };

    default:
      return {
        subject: 'Medical Symptom Analysis Complete - SahhaBot',
        htmlBody: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Symptom Analysis Ready</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background: linear-gradient(135deg, #5585b5 0%, #142d4c 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 10px 0; }
              .status-moderate { background-color: #dbeafe; color: #1e40af; }
              .status-high { background-color: #fed7aa; color: #c2410c; }
              .status-low { background-color: #dcfce7; color: #166534; }
              .cta-button { display: inline-block; background: #5585b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .disclaimer { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #64748b; }
              .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SahhaBot</h1>
                <p>Medical Symptom Analysis</p>
              </div>
              <div class="content">
                <h2>Hello ${name}</h2>
                <p>Your symptom analysis has been completed successfully. The results are now ready for your review.</p>
                
                <div class="status-badge status-${severity}">
                  ${severity === 'high' ? 'High Priority Level' : 
                    severity === 'moderate' ? 'Moderate Priority Level' : 
                    'Low Priority Level'}
                </div>
                
                <p><strong>What you'll find:</strong></p>
                <ul>
                  <li>Detailed analysis of your symptoms</li>
                  <li>Possible conditions and recommendations</li>
                  <li>Guidance on next steps</li>
                  <li>Information on when to seek medical help</li>
                </ul>
                
                <a href="#" class="cta-button">View Complete Results</a>
                
                <div class="disclaimer">
                  <strong>Important Medical Disclaimer:</strong> This analysis is for informational purposes only and is not a substitute for professional medical advice. In case of emergency, call 150 immediately.
                </div>
              </div>
              <div class="footer">
                <p>SahhaBot - Your Intelligent Medical Assistant</p>
                <p>This is an automated message, please do not reply</p>
              </div>
            </div>
          </body>
          </html>
        `,
        textBody: `
Hello ${name}

Your medical symptom analysis is complete!

Results are now available and include:
- Detailed symptom analysis
- Possible conditions and recommendations
- Next step guidance

Priority Level: ${severity === 'high' ? 'High' : severity === 'moderate' ? 'Moderate' : 'Low'}

To access your complete results, visit the application.

Important Notice: This analysis is for informational purposes only. In case of emergency, call 150.

SahhaBot - Your Intelligent Medical Assistant
        `
      };
  }
}

export function getSMSNotificationTemplate(
  language: Language,
  severity: 'low' | 'moderate' | 'high' | 'emergency' = 'moderate'
): SMSNotificationTemplate {
  switch (language) {
    case 'ar':
      return {
        message: `صحة بوت: تم إكمال تحليل الأعراض. النتائج جاهزة للمراجعة. ${severity === 'high' ? 'مستوى عالي من الأهمية' : severity === 'moderate' ? 'مستوى متوسط' : 'مستوى منخفض'}. افتح التطبيق لعرض التفاصيل. تنبيه: للطوارئ اتصل 150`,
        maxLength: 160
      };

    case 'da':
      return {
        message: `صحة بوت: كمل تحليل الأعراض. النتائج جاهزين. ${severity === 'high' ? 'مهم بزاف' : severity === 'moderate' ? 'مهم شوية' : 'ماشي مهم بزاف'}. افتح التطبيق باش تشوف. للطوارئ: 150`,
        maxLength: 160
      };

    case 'fr':
      return {
        message: `SahhaBot: Analyse des symptômes terminée. Résultats prêts. ${severity === 'high' ? 'Priorité élevée' : severity === 'moderate' ? 'Priorité modérée' : 'Priorité faible'}. Ouvrez l'app pour voir les détails. Urgence: 150`,
        maxLength: 160
      };

    default:
      return {
        message: `SahhaBot: Symptom analysis complete. Results ready for review. ${severity === 'high' ? 'High priority' : severity === 'moderate' ? 'Moderate priority' : 'Low priority'}. Open app to view details. Emergency: 150`,
        maxLength: 160
      };
  }
}