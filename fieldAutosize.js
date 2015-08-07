/*!
 * Автоматическое изменение размера текстового поля под содержимое
 *
 * https://github.com/Ser-Gen/fieldAutosize
 * Лицензия MIT
 */

(function() {

	// проверяем, доступны ли нужные возможности
	var isBrowserOld = false;

	if (!window.Element || !window.addEventListener) {
		isBrowserOld = true;
	};

	// поиск по подстроке
	if (!Element.prototype.matches) {
		Element.prototype.matches =
			Element.prototype.webkitMatchesSelector
			|| Element.prototype.mozMatchesSelector
			|| Element.prototype.msMatchesSelector
			|| Element.prototype.oMatchesSelector
			|| null;
	};

	if (!Element.prototype.matches) {
		isBrowserOld = true;
	};

	// если исполняется в старом браузере,
	// возвращаем безопасные методы
	if (isBrowserOld) {

		window.fieldAutosize = {
			process: function () {},
			handle: function () {}
		};
		return;

	} else {

		var _ = window.fieldAutosize = {

			// селектор, по которому будут обрабатываться элементы
			selector: (window.fieldAutosize && window.fieldAutosize.selector) || 'textarea',

			// селектор, по которому исключатся элементы
			exclude: (window.fieldAutosize && window.fieldAutosize.exclude) || false,

			// обрабатываем элементы по очереди
			process: function (e) {
				var elems = [];

				if (typeof e === 'object') {

					// если передано событие, получаем элемент
					if ('target' in e) {
						elems.push(e.target);
					}
					else {
						elems = e;
					};
				}

				// если передана строка, ищем по ней элементы
				else {
					elems = document.querySelectorAll(e);
				};

				// если есть элементы для обработки
				if (elems.length) {
					[].forEach.call(elems, function (elem) {

						// если передан неверный элемент
						// или элемент не должен обрабатываться,
						// выключаем
						if ((elem.nodeName.toLowerCase() !== 'textarea')
							|| (elem.getAttribute('data-fieldAutosize-disable') === 'true')
							|| (!elem.matches(_.selector))
							|| (_.exclude !== false && elem.matches(_.exclude))) {
							return;
						};

						_.handle(elem);
					});
				};
			},

			// обрабатываем элемент
			handle: function (elem) {

				if (!_.active) {
					return;
				};

				// получаем готовый стиль элемента
				var style = getComputedStyle(elem);
				var indent;

				// если элемент не отображается или не видим
				if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0)
					|| (style.display === 'none')) {
					return;
				};

				// нужно выставлять разную высоту
				// в зависимости от блочной модели
				if (style.boxSizing === 'border-box') {
					indent = -(parseInt(style.borderTopWidth)
					         + parseInt(style.borderBottomWidth));
				}
				else if (style.boxSizing === 'padding-box') {
					indent = 0;
				}
				else {
					indent = parseInt(style.paddingTop)
					       + parseInt(style.paddingBottom);
				};

				// установка высоты элемента
				elem.style.height = 0;
				elem.style.height = elem.scrollHeight - indent +'px';
			},

			// включен ли плагин
			active: (window.fieldAutosize && window.fieldAutosize.active) || true
		};
	};

	// обрабатываем элементы сразу
	_.process(_.selector);

	// и после событий на странице
	document.documentElement.addEventListener('input', _.process, false);
	document.documentElement.addEventListener('change', _.process, false);

	// следим за появлением новых элементов
	function getMutations () {
		(new MutationObserver(function(mutations) {
			if (_.active) {
				mutations.forEach(function(mutation) {
					if (mutation.type == "childList") {
						_.process(mutation.addedNodes);
					};
				});
			};
		})).observe(document.body, {
			childList: true,
			subtree: true
		});
	};

	// по готовности документа
	function onDomReady() {
		_.process(_.selector);

		if (window.MutationObserver) {
			getMutations();
		};
	};

	if (document.readyState !== "loading") {
		onDomReady();
	}
	else {
		document.addEventListener("DOMContentLoaded", onDomReady, false);
	};

})();
