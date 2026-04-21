
    function confirmarEncerramento(id) {
      if (confirm('Tem certeza que deseja encerrar esta matrícula? A ação não pode ser desfeita.')) {
        var form = document.getElementById('formEncerrar');
        form.action = '/matriculas/' + id + '/encerrar';
        form.submit();
      }
    }
  