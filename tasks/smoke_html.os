#Использовать "../src"

Настройки = Новый MarkdownНастройки("commonmark");

Сообщить("--- <a> ---");
Сообщить(Markdown.ВHTML("<a>", Настройки));
Сообщить("--- <span> ---");
Сообщить(Markdown.ВHTML("<span>", Настройки));
Сообщить("--- foo <span> bar ---");
Сообщить(Markdown.ВHTML("foo <span> bar", Настройки));
Сообщить("--- <m:abc> ---");
Сообщить(Markdown.ВHTML("<m:abc>", Настройки));
Сообщить("--- < a> ---");
Сообщить(Markdown.ВHTML("< a>", Настройки));
Сообщить("--- <a foo=bar bim! /> ---");
Сообщить(Markdown.ВHTML("<a foo=bar bim! />", Настройки));
