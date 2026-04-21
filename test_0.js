
    /*<![CDATA[*/
    var todosPrecos = [];
    try {
      var todosPrecosText = /*[[${todosPrecosJson}]]*/ '[]';
      if (!todosPrecosText || todosPrecosText === '') {
          todosPrecosText = '[]';
      }
      
      // Converte possíveis HTML Entities codificados que o Spring envie por string
      var textarea = document.createElement("textarea");
      textarea.innerHTML = todosPrecosText;
      var strClean = textarea.value;

      todosPrecos = JSON.parse(strClean);
    } catch (e) {
      console.warn("CT-Nexxus: Erro ao parsear precos do backend", e);
    }
    console.log("CT-Nexxus: todosPrecos injetado com " + todosPrecos.length + " itens.");
    /*]]>*/
  