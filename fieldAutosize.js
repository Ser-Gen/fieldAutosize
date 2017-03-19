/*!
 * Автоматическое изменение размера текстового поля под содержимое
 * https://github.com/Ser-Gen/fieldAutosize
 * 
 * Версия 1.0.0
 * 
 * Лицензия MIT
 */

// нестандартное событие
if (!'CustomEvent' in window) {
	window.CustomEvent = function CustomEvent(type, eventInitDict) {
		if (!type) {
			throw Error('TypeError: Failed to construct "CustomEvent": An event name must be provided.');
		}

		var event;
		eventInitDict = eventInitDict || {bubbles: false, cancelable: false, detail: null};

		if ('createEvent' in document) {
			try {
				event = document.createEvent('CustomEvent');
				event.initCustomEvent(type, eventInitDict.bubbles, eventInitDict.cancelable, eventInitDict.detail);
			} catch (error) {
				event = document.createEvent('Event');
				event.initEvent(type, eventInitDict.bubbles, eventInitDict.cancelable);
				event.detail = eventInitDict.detail;
			}
		}
		else {
			event = new Event(type, eventInitDict);
			event.detail = eventInitDict && eventInitDict.detail || null;
		}

		return event;
	};

	CustomEvent.prototype = Event.prototype;
};

(function() {

	// проверяем, доступны ли нужные возможности

	// отслежвание изменений в документе
	if (!MutationObserver) {
		var MutationObserver =
			window.MutationObserver
			|| window.WebKitMutationObserver
			|| null;
	};

	var isBrowserOld = false;

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

	}
	else {

		var _ = window.fieldAutosize = {

			// селектор, по которому будут обрабатываться элементы
			selector: (window.fieldAutosize && window.fieldAutosize.selector) || 'textarea',

			// селектор, по которому исключатся элементы
			exclude: (window.fieldAutosize && window.fieldAutosize.exclude) || false,

			// обрабатываем элементы по очереди
			process: function (e) {

				// если выключен, выходим
				if (!_.active) {
					return;
				};

				// если ничего не передано
				// обрабатываем элементы по стандартному селектору
				if (!e) {
					e = _.selector;
				};

				var elems = [];

				if (typeof e === 'object') {

					// если передано событие, получаем элемент
					if ('target' in e) {
						elems.push(e.target);
					}

					// иначе считаем переданное массивом
					else {
						elems = e;
					};
				}

				// если передана строка, ищем по ней элементы
				else if (typeof e === 'string') {
					elems = document.querySelectorAll(e);
				};

				// если есть элементы для обработки
				if (elems.length) {
					[].forEach.call(elems, function (elem) {

						// если передан неверный элемент
						// или элемент не должен обрабатываться,
						// выключаем
						if (isCanNotBeHandled(elem)) {
							return;
						};

						_.handle(elem);
					});
				};
			},

			// обрабатываем элемент
			handle: function (elem) {

				// если выключен, выходим
				if (!_.active) {
					return;
				};

				// получаем готовый стиль элемента
				var style = getComputedStyle(elem);
				var indent;

				// если нужно следить за невидимыми
				if (_.watchHidden) {
					var hiddenIndex = _._hidden.indexOf(elem);

					// если элемент невидим
					if (isHidden(elem, style)) {
						if (hiddenIndex < 0) {
							_._hidden.push(elem);
						};

						return;
					}
					else if (hiddenIndex > -1) {
						_._hidden.splice(hiddenIndex, 1);
					};
				};

				// нужно выставлять разную высоту
				// в зависимости от блочной модели
				if (style.boxSizing === 'border-box') {
					indent = -(parseInt(style.borderTopWidth)
					         + parseInt(style.borderBottomWidth));
				}
				else {
					indent = parseInt(style.paddingTop)
					       + parseInt(style.paddingBottom);
				};

				// текущая прокрутка документа
				var scrollY = window.pageYOffset || document.documentElement.scrollTop;
				var scrollX = window.pageXOffset || document.documentElement.scrollLeft;

				// установка высоты элемента
				elem.style.height = 'auto';

				var newHeight = elem.scrollHeight - indent;

				elem.style.height = elem.scrollHeight - indent +'px';
				trigger(elem, 'resize', {
					height: newHeight + indent
				});

				// восстановление прокрутки документа
				window.scrollTo(scrollX, scrollY);
			},

			// включен ли плагин
			active: (window.fieldAutosize && window.fieldAutosize.active) || true,

			// следить ли за скрытыми полями
			watchHidden: (window.fieldAutosize && window.fieldAutosize.watchHidden) || true,

			// атрибуты контейнеров, от которых
			// может зависеть видимость полей
			// при старте скрипта
			watchAttrs: (window.fieldAutosize && window.fieldAutosize.watchAttrs) || ['style', 'class', 'hidden'],

			// скрытые элементы
			_hidden: [],

			// следить ли за изменением размера поля
			watchResize: (window.fieldAutosize && window.fieldAutosize.watchResize) || true
		};
	};

	// обрабатываем элементы после событий на странице
	document.addEventListener('input', _.process, false);
	window.addEventListener('resize', function () {
		_.process(_.selector);
	}, false);

	// действуем по готовности документа
	if (document.readyState !== "loading") {
		onDomReady();
	}
	else {
		document.addEventListener("DOMContentLoaded", onDomReady, false);
	};

	// если нужно следить за изменением размера поля
	// которое может делать пользователь
	if (_.watchResize) {
		var heightValueCache = null;
		var heightElementCache = null;

		document.addEventListener('mousedown', function (e) {

			// если это обрабатываемый элемент
			if (!isCanNotBeHandled(e.target)) {

				// записываем его высоту
				heightElementCache = e.target;
				heightValueCache = e.target.style.height;
			};
		});

		document.addEventListener('mouseup', function (e) {

			// если нет записанной высоты, выходим
			if (!heightValueCache) { return; };

			// если у элемента высота изменилась
			if (e.target === heightElementCache
				&& e.target.style.height !== heightValueCache) {

				// делаем его необрабатываемым
				e.target.setAttribute('data-fieldAutosize-disable', true);
			};

			heightElementCache = null;
			heightValueCache = null;
		});
	};

	// работа по готовности документа
	function onDomReady() {
		_.process(_.selector);

		if (MutationObserver) {
			getMutations();
		};
	};

	// реакция на изменения документа
	function getMutations () {

		// следим за появлением новых элементов
		(new MutationObserver(processNew)).observe(document.body, {
			childList: true,
			subtree: true
		});

		// следим за скрытыми элементами, если нужно
		if (_.watchHidden) {
			_.watchAreaAttrs = _.watchAttrs;

			var styleIndex = _.watchAreaAttrs.indexOf('style');

			if (styleIndex > -1) {
				_.watchAreaAttrs.splice(styleIndex, 1);
			};

			(new MutationObserver(processHidden)).observe(document.body, {
				attributes: true,
				attributeFilter: _.watchAttrs,
				subtree: true
			});
		};
	};

	// обработка добавляемых элементов
	function processNew (mutations) {
		if (_.active) {
			mutations.forEach(function(mutation) {
				if (mutation.type == "childList") {
					throttle(_.process(mutation.addedNodes));
				};
			});
		};
	};

	// обработка изменений атрибутов
	function processHidden (mutations) {

		// если нет скрытых элементов
		if (!_._hidden.length) { return; };

		// если есть скрытые
		mutations.forEach(function(mutation) {
			if (mutation.target) {

				// если изменился атрибут текстового поля
				if (mutation.target.nodeName === 'TEXTAREA' && _.watchAreaAttrs.indexOf(mutation.attributeName) > -1) {
					throttle(_.handle(mutation.target));
				}

				// если изменился атрибут произвольного элемента
				// ищем текстовые поля внутри
				else {
					throttle(_.process(_._hidden));
				};
			};
		});
	};

	// должен ли обрабатываться элемент
	function isCanNotBeHandled (elem) {
		return elem.nodeName.toLowerCase() !== 'textarea'
		|| elem.getAttribute('data-fieldAutosize-disable') === 'true'
		|| !elem.matches(_.selector)
		|| (_.exclude !== false && elem.matches(_.exclude));
	};
		
	// видим ли элемент
	function isHidden (elem, style) {
		if (style === undefined) {
			style = getComputedStyle(elem);
		};
		if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0)
		|| (style.display === 'none')) {
			return true;
		};

		return false;
	};

	// функция-регулятор
	// для ограничения количества вызовов фукнции
	function throttle (func, ms) {
		var args, _this;

		return function () {
			if (args === void 0) {
				args = arguments;
				_this = this;

				setTimeout(function () {
					if (args.length === 1) {
						func.call(_this, args[0]);
					}
					else {
						func.apply(_this, args);
					};

					args = void 0;
				}, ms || 50);
			};
		};
	};

	// генерация событий
	function trigger (elem, name, data) {
		var event = new CustomEvent('fieldAutosize:'+ name, {
			detail: data || null
		});

		elem.dispatchEvent(event);
	};

})();
