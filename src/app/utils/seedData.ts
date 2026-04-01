import type { Book } from '@/app/contexts/BooksContext';

export function seedDemoData() {
  // Check if data already exists
  const existingBooks = localStorage.getItem('books');
  if (existingBooks) {
    const books = JSON.parse(existingBooks);
    if (books.length > 0) {
      return; // Data already exists
    }
  }

  // Create demo book
  const demoBook: Book = {
    id: 'demo_book_1',
    title: 'Sehrli O\'rmon',
    fullText: `Qadimda, uzoq shaharda bir yosh bola yashardi. Uning ismi Ali edi. Ali har kuni maktabdan keyin bog'da o'ynardi. Bir kuni u bog'ning oxirida sirli eshikni topdi. Eshik ortida ajoyib sehrli o'rmon bor edi.

O'rmonda turli xil jonzotlar yashardi - gap so'zlashuvchi hayvonlar, gullab-yashnagan daraxtlar, va ajoyib sehrgarlar. Ali o'rmonning markazida ulkan qal'a borligini bilib oldi. Qal'ada esa yoqimsiz sehrgar yashardi va u butun o'rmonni o'z qo'li ostiga olmoqchi edi.

Ali jasoratli qahramon bo'lishga qaror qildi. U yangi do'stlar topdi - aqlli tulki Zarif va kuchli ayiq Bobur. Ular birga yomon sehrgarni mag'lub etish uchun yo'lga chiqishdi.

Ular ko'p qiyinchiliklarga duch kelishdi - sirli jumboqlarni yechishdi, xavfli daryolardan o'tishdi, va tog'larni zabt etishdi. Oxir-oqibat, ular qal'aga yetib kelishdi va yomon sehrgar bilan to'qnash kelishdi.

Jang qizg'in edi, lekin Ali va uning do'stlari birga ishlash orqali sehrgarni mag'lub etishdi. O'rmon tinchlikka qaytdi va Ali qahramon bo'lib qoldi. U o'z shahriga qaytdi, lekin sehrli o'rmonni hech qachon unutmadi.`,
    chapters: [
      {
        title: 'Sirli Eshikni Topish',
        content: `Ali har kuni maktabdan keyin bog'da o'ynardi. Bugun u bog'ning eng chekka qismiga bordi va ko'pdan beri e'tibor bermagan qismni o'rganishga qaror qildi. 

U daraxtlar orasida yashiringan eski eshikni topdi. Eshik yog'och edi va uning ustida g'alati belgilar bor edi. Ali eshikni ochishga qaror qildi...

Eshik orqasida ajoyib manzara ochildi - sehrli o'rmon! Daraxtlar nurlanib turardi, gullar rang-barang edi, va havo ajoyib xushbo'y edi.`,
        roles: ['Ali - jasoratli bola', 'Birinchi uchraydigan sehrli jonzot']
      },
      {
        title: 'Yangi Do\'stlarni Topish',
        content: `Ali o'rmonga kirdi va gap so'zlashuvchi hayvonlarni uchratdi. Birinchisi aqlli tulki Zarif edi. Zarif Aliga o'rmonning sirlari haqida so'zladi.

"Bu o'rmon xavfda," dedi Zarif. "Yomon sehrgar qal'ada yashamoqda va u butun o'rmonni o'z qo'li ostiga olmoqchi. Bizga yordam kerak!"

Tez orada ular kuchli ayiq Boburni ham uchratishdi. Bobur ham yomon sehrgarni to'xtatishga tayyor edi.

Uchala do'st qal'aga yo'l olishga qaror qilishdi.`,
        roles: ['Ali', 'Zarif tulki', 'Bobur ayiq']
      },
      {
        title: 'Qal\'aga Sayohat',
        content: `Sayohat oson emas edi. Ular birinchi to'siqqa duch kelishdi - sirli ko'prik. Ko'prikni o'tish uchun jumboqni yechish kerak edi.

"Men ko'p ko'raman lekin ko'zim yo'q, men ko'p eshitaman lekin qulog'im yo'q. Men kimman?" - deb so'radi ko'prik.

Ali va do'stlari javobni topishdi va ko'prikdan o'tishdi. Keyin ular xavfli daryoga yetib kelishdi. Bobur kuchli ayiq bo'lgani uchun, u hammasini orqaga olib o'tdi.

Nihoyat, ular qal'a oldiga yetib kelishdi.`,
        roles: ['Ali', 'Zarif', 'Bobur', 'Sirli ko\'prik']
      },
      {
        title: 'Yomon Sehrgar Bilan Jang',
        content: `Qal'a ichida yomon sehrgar kutib turardi. U qora libos kiygan va o'zining sehrli tayoqchasini ushlab turardi.

"Siz mening qal'amga qaror kiritdingiz!" deb qichqirdi sehrgar. "Endi jazongizni oling!"

Jang boshlandi. Sehrgar turli sehrlarni ishlatdi - olov to'plari, muzli shamollar, va qorong'u tutun. Lekin Ali, Zarif va Bobur birga ishlashdi.

Zarif aqlli rejalari bilan sehrgarni chalg'itdi, Bobur o'z kuchi bilan himoya qildi, va Ali jasorati bilan eng muhim zarbani berdi. 

Sehrgarning tayoqchasi sindirildi va u o'z kuchini yo'qotdi. O'rmon ozod bo'ldi!`,
        roles: ['Ali', 'Zarif', 'Bobur', 'Yomon sehrgar']
      },
      {
        title: 'Uyga Qaytish',
        content: `Jang tugagach, barcha o'rmon jonivorlari Ali va do'stlarini qahramonlar sifatida kutib olishdi. Ular bayram uyushtirishdi va Ali uchun alohida mukofot tayyorlashdi.

Zarif Aliga: "Sen haqiqiy qahramon bo'ldingsan. O'rmonimizni qutqarding!"

Lekin Ali uyiga qaytish vaqti kelganini tushundi. U do'stlari bilan xayrlashdi va ularni hech qachon unutmaslikka va'da berdi.

U sirli eshikdan o'tdi va o'z bog'iga qaytdi. Hamma narsa avvalgidek edi, lekin Ali endi boshqacha edi. U katta sarguzasht o'tkazgan va chinakam do'stlar topgan edi.

Har doim sehrli o'rmon uning yonida, eshik orqasida kutib turardi...`,
        roles: ['Ali', 'Zarif', 'Bobur', 'O\'rmon jonivorlari']
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  };

  // Save to localStorage
  localStorage.setItem('books', JSON.stringify([demoBook]));
}
