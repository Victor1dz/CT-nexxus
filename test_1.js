
    $(document).ready(function () {
      // Máscaras
      $('#telefone').mask('(00) 00000-0000');
      $('#cpf').mask('000.000.000-00');
      $('#cep').mask('00000-000');

      // --- 1. BUSCA POR CEP (ViaCEP) ---
      // Ação do Botão (Explicitamente previne submit)
      $('#btnBuscarCep').on('click', function (e) {
        e.preventDefault();
        var cep = $('#cep').val();
        buscarDadosDoCep(cep);
      });

      // Ação do Blur (Sair do campo)
      $('#cep').on('blur', function () {
        var cep = $(this).val();
        buscarDadosDoCep(cep);
      });

      function buscarDadosDoCep(valor) {
        var cep = valor.replace(/\D/g, '');

        // Validação básica
        if (cep === "") return;
        if (cep.length !== 8) {
          // Opcional: Feedback discreto ou ignorar se incompleto
          return;
        }

        // Feedback visual
        var $btn = $('#btnBuscarCep');
        var originalIcon = $btn.html();
        $btn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>').prop('disabled', true);
        $("#logradouro").attr("placeholder", "Buscando CEP...");

        $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", function (dados) {
          if (!("erro" in dados)) {
            $("#logradouro").val(dados.logradouro);
            $("#bairro").val(dados.bairro);
            $("#cidade").val(dados.localidade);
            $("#uf").val(dados.uf);
            $("#numero").focus();
            $("#sugestoes-logradouro").hide(); // Esconde sugestões se houver
          } else {
            exibirErro("CEP não encontrado.");
            limpaFormularioCep();
          }
        }).fail(function () {
          exibirErro("Erro ao buscar CEP.");
          limpaFormularioCep();
        }).always(function () {
          // Restaura botão
          $btn.html(originalIcon).prop('disabled', false);
          $("#logradouro").attr("placeholder", "Comece a digitar o nome da rua...");
        });
      }

      function limpaFormularioCep() {
        $("#logradouro").val("");
        $("#bairro").val("");
        // Não limpa Cidade/UF para manter contexto
      }

      function exibirErro(msg) {
        if (typeof Swal !== 'undefined') Swal.fire('Atenção', msg, 'warning');
        else alert(msg);
      }


      // --- 2. BUSCA "GOOGLE MAPS STYLE" (OSM Nominatim) ---
      // Permite digitar "Rua X, Cidade" e achar resultados reais

      var timeoutAutocomplete = null;

      $('#logradouro').on('input', function () {
        var query = $(this).val();
        var $lista = $('#sugestoes-logradouro');

        if (query.length < 4) {
          $lista.hide();
          return;
        }

        // Contexto ajuda (se tiver cidade preenchida, adiciona na busca)
        var cidade = $('#cidade').val();
        var uf = $('#uf').val();
        var termoBusca = query;

        // Se tiver cidade, refina a busca para o Brasil + Cidade
        var viewbox = "";
        // Nominatim é livre, mas pede User-Agent (o browser manda) e limite de uso.
        // Vamos limitar a frequência com debounce.

        clearTimeout(timeoutAutocomplete);
        timeoutAutocomplete = setTimeout(function () {
          $lista.html('<div class="list-group-item text-muted"><span class="spinner-border spinner-border-sm"></span> Buscando...</div>').show();

          // Monta Query: Rua + Cidade + Brasil
          var fullQuery = query;
          if (cidade) fullQuery += ", " + cidade;
          fullQuery += ", Brazil";

          $.ajax({
            url: "https://nominatim.openstreetmap.org/search",
            dataType: "json",
            data: {
              q: fullQuery,
              format: "json",
              addressdetails: 1,
              limit: 5,
              countrycodes: 'br'
            },
            success: function (data) {
              $lista.empty();
              if (data.length === 0) {
                $lista.html('<div class="list-group-item text-muted small">Nenhum endereço encontrado. Tente adicionar a cidade.</div>');
              } else {
                $.each(data, function (i, item) {
                  var addr = item.address;
                  // Tenta montar um label amigável
                  var rua = addr.road || addr.pedestrian || addr.street || item.name || "";
                  var num = addr.house_number || "";
                  var bairro = addr.suburb || addr.neighbourhood || addr.city_district || "";
                  var cid = addr.city || addr.town || addr.village || addr.municipality || "";
                  var est = addr.state || "";
                  var cep = addr.postcode || "";

                  // Só mostra se tiver pelo menos rua ou cidade
                  if (!rua && !cid) return;

                  var labelMain = (rua + (num ? ", " + num : ""));
                  var labelSub = (bairro ? bairro + " - " : "") + cid + "/" + est + (cep ? " (" + cep + ")" : "");

                  // Cria elemento clicável
                  var $link = $('<a href="#" class="list-group-item list-group-item-action">')
                    .html('<strong>' + labelMain + '</strong><br><small class="text-muted">' + labelSub + '</small>')
                    .data('dados', {
                      rua: rua,
                      bairro: bairro,
                      cidade: cid,
                      uf: converteEstadoParaSigla(est),
                      cep: cep
                    });

                  $lista.append($link);
                });
              }
            },
            error: function () {
              $lista.html('<div class="list-group-item text-danger small">Erro na busca automática.</div>');
            }
          });
        }, 600); // 600ms de delay para não floodar
      });

      // Clique na sugestão do OSM
      $('#sugestoes-logradouro').on('click', 'a', function (e) {
        e.preventDefault();
        var dados = $(this).data('dados');

        if (dados) {
          if (dados.rua) $('#logradouro').val(dados.rua);
          if (dados.bairro) $('#bairro').val(dados.bairro);
          if (dados.cidade) $('#cidade').val(dados.cidade);
          if (dados.uf) $('#uf').val(dados.uf);
          // CEP do OSM nem sempre é formatado ou preciso, mas se tiver, usamos
          if (dados.cep) {
            // Formata CEP 00000-000
            var cepLimpo = dados.cep.replace(/\D/g, '');
            if (cepLimpo.length === 8) {
              $('#cep').val(cepLimpo.substring(0, 5) + '-' + cepLimpo.substring(5));
            }
          }
        }
        $('#sugestoes-logradouro').hide();
        $('#numero').focus();
      });

      // Fecha lista ao clicar fora
      $(document).click(function (e) {
        if (!$(e.target).closest('#logradouro, #sugestoes-logradouro').length) {
          $('#sugestoes-logradouro').hide();
        }
      });

      // Helper: Nome do Estado -> Sigla (Nominatim retorna nome completo muitas vezes)
      function converteEstadoParaSigla(nome) {
        if (!nome) return "SP"; // Fallback
        var map = {
          "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA", "Ceará": "CE",
          "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT",
          "Mato Grosso do Sul": "MS", "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
          "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
          "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
          "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
        };
        return map[nome] || "SP"; // Tenta mapear ou devolve SP (ou o próprio nome se não achar, mas o select só aceita sigla)
      }

    });

    // --- 3. LOGICA DE PREÇO DINÂMICO E HORARIO ---

    // Funções Globais para o Toggle (acessíveis via onclick)
    window.togglePersonalizadoManual = function () {
      $('#horarioSelect').hide();
      $('#btnTogglePersonalizado').hide();
      $('#divHorarioPersonalizado').slideDown();
      $('#horarioSelect').val(''); // Limpa seleção fixa
    };

    window.fecharPersonalizado = function () {
      $('#divHorarioPersonalizado').slideUp(function () {
        $('#horarioSelect').show();
        $('#btnTogglePersonalizado').show();
      });
      // Limpa campos manuais
      $('.dias-check').prop('checked', false);
      $('#horaPersonalizada').val('');
      $('#horaFimPersonalizada').val('');
      $('#checkLivre').prop('checked', false).trigger('change');
    };

    $(document).ready(function () {

      // --- EVENTOS DELEGADOS (Funciona para blocos existentes e clonados automaticamente) ---

      $(document).on('change', '.modalidade-select', function () {
        var $block = $(this).closest('.matricula-block');
        var modId = $(this).val();
        console.log("Modalidade selecionada! ID: " + modId);
        var $option = $(this).find('option:selected');
        var exige = $option.data('exige-horario') === true;

        var $selectPreco = $block.find('.preco-select');
        var $selectHorario = $block.find('.horario-select');
        var $divPerson = $block.find('.div-horario-personalizado');
        var $btnToggle = $block.find('.btn-toggle-personalizado');
        var $checkLivre = $block.find('.check-livre');

        $selectPreco.val('');
        atualizarPrecoDisplayBlock($block);

        // Filtra Horários
        $selectHorario.find('option').hide();
        $selectHorario.find('option[value=""]').show();
        $selectHorario.find('option[value="custom"]').show();
        if (modId) {
          $selectHorario.find('option[data-modalidade="' + modId + '"]').show();
        }

        // Reset visual
        if (exige) {
          $selectHorario.hide();
          $btnToggle.hide();
          $divPerson.slideDown();
          $selectHorario.val('');
        } else {
          $divPerson.slideUp(function () {
            $selectHorario.show();
            $btnToggle.show();
          });
          $block.find('.dias-check').prop('checked', false);
          $block.find('.hora-inicio-pers').val('');
          $block.find('.hora-fim-pers').val('');
          $checkLivre.prop('checked', false).trigger('change');
        }

        if (modId) {
          carregarPrecosAjaxContext($block, modId);
        }
      });

      $(document).on('change', '.horario-select', function () {
        var $block = $(this).closest('.matricula-block');
        if ($(this).val() === 'custom') {
          $(this).hide();
          $block.find('.btn-toggle-personalizado').hide();
          $block.find('.div-horario-personalizado').slideDown();
          $(this).val('');
        }
      });

      $(document).on('click', '.btn-toggle-personalizado', function () {
        var $block = $(this).closest('.matricula-block');
        $block.find('.horario-select').hide().val('');
        $(this).hide();
        $block.find('.div-horario-personalizado').slideDown();
      });

      $(document).on('click', '.btn-fechar-personalizado', function () {
        var $block = $(this).closest('.matricula-block');
        $block.find('.div-horario-personalizado').slideUp(function () {
          $block.find('.horario-select').show();
          $block.find('.btn-toggle-personalizado').show();
        });
        $block.find('.dias-check').prop('checked', false);
        $block.find('.hora-inicio-pers').val('');
        $block.find('.hora-fim-pers').val('');
        $block.find('.check-livre').prop('checked', false).trigger('change');
      });

      $(document).on('change', '.check-livre', function () {
        var $block = $(this).closest('.matricula-block');
        var isChecked = $(this).is(':checked');
        $block.find('.dias-check').prop('disabled', isChecked);
        $block.find('.hora-inicio-pers').prop('disabled', isChecked);
        $block.find('.hora-fim-pers').prop('disabled', isChecked);
      });

      $(document).on('change', '.preco-select', function () {
        atualizarPrecoDisplayBlock($(this).closest('.matricula-block'));
      });

      $(document).on('change', '.input-data-inicio', function () {
        var $block = $(this).closest('.matricula-block');
        var dateVal = $(this).val();
        if (dateVal) {
          var day = parseInt(dateVal.split('-')[2], 10);
          $block.find('.input-dia-vencimento').val(day);
        }
      });

      $(document).on('click', '.btn-remover-matricula', function () {
        var $block = $(this).closest('.matricula-block');
        if ($('.matricula-block').length > 1) {
          $block.slideUp(300, function () {
            $(this).remove();
            if ($('.matricula-block').length === 1) {
              $('.btn-remover-matricula').hide();
            }
          });
        }
      });

      function carregarPrecosAjaxContext($block, modalidadeId) {
        console.log("Carregando precos localmente para modalidade: " + modalidadeId);
        var $selectPreco = $block.find('.preco-select');
        $selectPreco.empty();

        if (!modalidadeId) {
          $selectPreco.append('<option value="">Selecione a modalidade primeiro...</option>');
          atualizarPrecoDisplayBlock($block);
          return;
        }

        // Filter local data
        var data = todosPrecos.filter(function (p) {
          var idMod = p.modalidadeId || (p.modalidade && p.modalidade.id);
          return idMod == modalidadeId;
        });

        console.log("Filtro local concluído. Itens encontrados: " + data.length);

        if (data.length === 0) {
          $selectPreco.append('<option value="" selected>Sem planos cadastrados nesta Modalidade</option>');
        } else {
          $selectPreco.append('<option value="" selected>Selecione o Plano...</option>');
          $.each(data, function (i, p) {
            var valorFmt = parseFloat(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            var texto = p.descricao + " (R$ " + valorFmt + ")";
            $selectPreco.append($('<option>', {
              value: p.id,
              text: texto,
              'data-valor': valorFmt
            }));
          });
        }
        atualizarPrecoDisplayBlock($block);
      }

      function atualizarPrecoDisplayBlock($block) {
        var $selected = $block.find('.preco-select option:selected');
        var valor = $selected.data('valor');
        if (valor) {
          $block.find('.preco-display').text('Valor: R$ ' + valor);
        } else {
          $block.find('.preco-display').text('Valor: R$ 0,00');
        }
      }

      // Helper for updating display value in new blocks
      function atualizarNovaPrecoDisplayBlock($block) {
        var $selected = $block.find('.nova-preco-select option:selected');
        var valor = $selected.data('valor');
        if (valor) {
          $block.find('.nova-preco-display').text('Valor: R$ ' + valor);
        } else {
          $block.find('.nova-preco-display').text('Valor: R$ 0,00');
        }
      }

      function carregarNovaPrecosAjaxContext($block, modalidadeId) {
        console.log("Carregando novos precos localmente para modalidade: " + modalidadeId);
        var $selectPreco = $block.find('.nova-preco-select');
        $selectPreco.empty();

        if (!modalidadeId) {
          $selectPreco.append('<option value="">Selecione a modalidade primeiro...</option>');
          atualizarNovaPrecoDisplayBlock($block);
          return;
        }

        // Filter local data
        var data = todosPrecos.filter(function (p) {
          var idMod = p.modalidadeId || (p.modalidade && p.modalidade.id);
          return idMod == modalidadeId;
        });

        console.log("Filtro local concluído para nova matricula. Itens encontrados: " + data.length);

        if (data.length === 0) {
          $selectPreco.append('<option value="" selected>Sem planos cadastrados nesta Modalidade</option>');
        } else {
          $selectPreco.append('<option value="" selected>Selecione o Plano...</option>');
          $.each(data, function (i, p) {
            var valorFmt = parseFloat(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            var texto = p.descricao + " (R$ " + valorFmt + ")";
            $selectPreco.append($('<option>', {
              value: p.id,
              text: texto,
              'data-valor': valorFmt
            }));
          });
        }
        atualizarNovaPrecoDisplayBlock($block);
      }

      // NOVO BLOCO - Eventos
      $(document).on('change', '.nova-modalidade-select', function () {
        var $block = $(this).closest('.nova-matricula-block');
        var modId = $(this).val();
        console.log("Nova Modalidade selecionada! ID: " + modId);
        var $option = $(this).find('option:selected');
        var exige = $option.data('exige-horario') === true;

        var $selectPreco = $block.find('.nova-preco-select');
        var $selectHorario = $block.find('.nova-horario-select');
        var $divPerson = $block.find('.div-novo-horario-personalizado');
        var $btnToggle = $block.find('.btn-toggle-novo-personalizado');
        var $checkLivre = $block.find('.nova-check-livre');

        $selectPreco.val('');
        atualizarNovaPrecoDisplayBlock($block);

        $selectHorario.find('option').hide();
        $selectHorario.find('option[value=""]').show();
        $selectHorario.find('option[value="custom"]').show();

        if (modId) {
          $selectHorario.find('option[data-modalidade="' + modId + '"]').show();
        }

        if (exige) {
          $selectHorario.hide();
          $btnToggle.hide();
          $divPerson.slideDown();
          $selectHorario.val('');
        } else {
          $divPerson.slideUp(function () {
            $selectHorario.show();
            $btnToggle.show();
          });
          $block.find('.nova-dias-check').prop('checked', false);
          $block.find('.nova-hora-inicio-pers').val('');
          $block.find('.nova-hora-fim-pers').val('');
          $checkLivre.prop('checked', false).trigger('change');
        }

        if (modId) {
          carregarNovaPrecosAjaxContext($block, modId);
        } else {
          carregarNovaPrecosAjaxContext($block, null);
        }
      });

      $(document).on('change', '.nova-horario-select', function () {
        var $block = $(this).closest('.nova-matricula-block');
        if ($(this).val() === 'custom') {
          $(this).hide();
          $block.find('.btn-toggle-novo-personalizado').hide();
          $block.find('.div-novo-horario-personalizado').slideDown();
          $(this).val('');
        }
      });

      $(document).on('click', '.btn-toggle-novo-personalizado', function () {
        var $block = $(this).closest('.nova-matricula-block');
        $block.find('.nova-horario-select').hide().val('');
        $(this).hide();
        $block.find('.div-novo-horario-personalizado').slideDown();
      });

      $(document).on('click', '.btn-fechar-novo-personalizado', function () {
        var $block = $(this).closest('.nova-matricula-block');
        $block.find('.div-novo-horario-personalizado').slideUp(function () {
          $block.find('.nova-horario-select').show();
          $block.find('.btn-toggle-novo-personalizado').show();
        });
        $block.find('.nova-dias-check').prop('checked', false);
        $block.find('.nova-hora-inicio-pers').val('');
        $block.find('.nova-hora-fim-pers').val('');
        $block.find('.nova-check-livre').prop('checked', false).trigger('change');
      });

      $(document).on('change', '.nova-check-livre', function () {
        var $block = $(this).closest('.nova-matricula-block');
        var isChecked = $(this).is(':checked');
        $block.find('.nova-dias-check').prop('disabled', isChecked);
        $block.find('.nova-hora-inicio-pers').prop('disabled', isChecked);
        $block.find('.nova-hora-fim-pers').prop('disabled', isChecked);
      });

      $(document).on('change', '.nova-preco-select', function () {
        atualizarNovaPrecoDisplayBlock($(this).closest('.nova-matricula-block'));
      });

      $(document).on('change', '.nova-input-data-inicio', function () {
        var $block = $(this).closest('.nova-matricula-block');
        var dateVal = $(this).val();
        if (dateVal) {
          var day = parseInt(dateVal.split('-')[2], 10);
          $block.find('.nova-input-dia-vencimento').val(day);
        }
      });

      $(document).on('click', '.btn-remover-nova-matricula', function () {
        var $block = $(this).closest('.nova-matricula-block');
        if ($('.nova-matricula-block').length > 1) {
          $block.slideUp(300, function () {
            $(this).remove();
            if ($('.nova-matricula-block').length === 1) {
              $('.btn-remover-nova-matricula').hide();
            }
          });
        }
      });

      // Initialize existing block initial DOM states
      $('.matricula-block').each(function () {
        var $block = $(this);
        var $modSelect = $block.find('.modalidade-select');
        var val = $modSelect.val();

        if (val) {
          $modSelect.trigger('change');
        } else {
          // Em caso de blocos vazios, ou se a opção escolhida for em branco
          var $selectPreco = $block.find('.preco-select');
          if ($selectPreco.find('option').length <= 1) { // Só tem a option default ou nenhuma
            $selectPreco.html('<option value="">Selecione a modalidade primeiro...</option>');
          }
        }
      });

      // Initialize EXISTING blocks for 'Nova Matrícula' section (Autofill restore patch)
      $('.nova-matricula-block').each(function () {
        var $block = $(this);
        var $modSelect = $block.find('.nova-modalidade-select');
        var val = $modSelect.val();

        if (val) {
          $modSelect.trigger('change');
        } else {
          var $selectPreco = $block.find('.nova-preco-select');
          if ($selectPreco.find('option').length <= 1) {
            $selectPreco.html('\x3Coption value=""\x3ESelecione a modalidade primeiro...\x3C/option\x3E');
          }
        }
      });

      // Clone block logic
      // Clone block logic
      $('#btnAdicionarModalidade').click(function () {
        var $container = $('#matriculasContainer');
        var $firstBlock = $container.find('.matricula-block').first();
        var $newBlock = $firstBlock.clone();

        $newBlock.find('.dias-check').each(function () {
          $(this).removeAttr('id');
          $(this).next('label').removeAttr('for');
          var rId = 'chk_' + Math.floor(Math.random() * 1000000);
          $(this).attr('id', rId);
          $(this).next('label').attr('for', rId);
        });

        var checkLivreId = 'livre_' + Math.floor(Math.random() * 1000000);
        $newBlock.find('.check-livre').attr('id', checkLivreId).next('label').attr('for', checkLivreId);

        $newBlock.find('select').val('');
        $newBlock.find('input[type="text"], input[type="hidden"], input[type="time"], input[type="date"]').val('');
        $newBlock.find('input[type="checkbox"]').prop('checked', false).prop('disabled', false);
        $newBlock.find('.preco-display').text('Valor: R$ 0,00');
        $newBlock.find('.preco-select').find('option:not([value=""])').remove();

        var hoje = new Date().toISOString().split('T')[0];
        $newBlock.find('.input-data-inicio').val(hoje);
        $newBlock.find('.input-dia-vencimento').val('10');

        $newBlock.find('.horario-select').show();
        $newBlock.find('.btn-toggle-personalizado').show();
        $newBlock.find('.div-horario-personalizado').hide();

        $newBlock.hide();
        $container.append($newBlock);
        $newBlock.slideDown();
        $container.find('.btn-remover-matricula').show();
      });

      // Clone Novo block logic (Edit Page)
      $('#btnAdicionarModalidadeNova').click(function () {
        var $container = $('#matriculasContainerNova');
        var $firstBlock = $container.find('.nova-matricula-block').first();
        var $newBlock = $firstBlock.clone();

        $newBlock.find('.nova-dias-check').each(function () {
          $(this).removeAttr('id');
          $(this).next('label').removeAttr('for');
          var rId = 'nchk_' + Math.floor(Math.random() * 1000000);
          $(this).attr('id', rId);
          $(this).next('label').attr('for', rId);
        });

        var checkLivreId = 'nlivre_' + Math.floor(Math.random() * 1000000);
        $newBlock.find('.nova-check-livre').attr('id', checkLivreId).next('label').attr('for', checkLivreId);

        $newBlock.find('select').val('');
        $newBlock.find('input[type="text"], input[type="hidden"], input[type="time"], input[type="date"]').val('');
        $newBlock.find('input[type="checkbox"]').prop('checked', false).prop('disabled', false);
        $newBlock.find('.nova-preco-display').text('Valor: R$ 0,00');
        $newBlock.find('.nova-preco-select').find('option:not([value=""])').remove();

        var hoje = new Date().toISOString().split('T')[0];
        $newBlock.find('.nova-input-data-inicio').val(hoje);
        $newBlock.find('.nova-input-dia-vencimento').val('10');

        $newBlock.find('.nova-horario-select').show();
        $newBlock.find('.btn-toggle-novo-personalizado').show();
        $newBlock.find('.div-novo-horario-personalizado').hide();

        $newBlock.hide();
        $container.append($newBlock);
        $newBlock.slideDown();
        $container.find('.btn-remover-nova-matricula').show();
      });

      // Form Submit parsing
      $('form').submit(function (e) {
        $('.matricula-block, .nova-matricula-block').each(function () {
          var $blk = $(this);
          // Determine if it's the 'new' or 'existing' block to use correct selectors
          var isNova = $blk.hasClass('nova-matricula-block');
          var diasChecks = isNova ? '.nova-dias-check:checked' : '.dias-check:checked';
          var horaIniInput = isNova ? '.nova-hora-inicio-pers' : '.hora-inicio-pers';
          var checkLivreInput = isNova ? '.nova-check-livre' : '.check-livre';
          var hiddenInput = isNova ? '.novo-horario-personalizado-input' : '.horario-personalizado-input';
          var divPersonalizado = isNova ? '.div-novo-horario-personalizado' : '.div-horario-personalizado';

          if ($blk.find(divPersonalizado).is(':visible')) {
            if ($blk.find(checkLivreInput).is(':checked')) {
              $blk.find(hiddenInput).val("Horário Livre");
            } else {
              var dias = [];
              $blk.find(diasChecks).each(function () { dias.push($(this).val()); });
              var horaIni = $blk.find(horaIniInput).val();

              // Format: Seg,Qua|10:00
              var horarioStr = "";
              if (dias.length > 0 && horaIni) {
                horarioStr = dias.join(',') + '|' + horaIni;
              }
              $blk.find(hiddenInput).val(horarioStr);
            }
          } else {
            $blk.find(hiddenInput).val("");
          }
        });
      });

    });
  