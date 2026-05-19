#Использовать "../src"

Сообщить("escape: " + Markdown.ВHTML("a \\* b"));
Сообщить("code:   " + Markdown.ВHTML("a `code` b"));
Сообщить("entity: " + Markdown.ВHTML("a &nbsp; b"));
Сообщить("numref: " + Markdown.ВHTML("a &#65; b"));
Сообщить("auto:   " + Markdown.ВHTML("<https://example.com>"));
Сообщить("hard:   " + Markdown.ВHTML("a  " + Символы.ПС + "b"));
Сообщить("soft:   " + Markdown.ВHTML("a" + Символы.ПС + "b"));
