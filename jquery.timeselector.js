/**
 * @author     Tom Krush
 * @copyright  (c) 2009 Tom Krush
 *
 * jQuery plugin that turns a input field into an advanced iCal style time selector.
 */
 
(function($) {

function TimeSelector() {
	this.format = "m/d/Y h:ia";
}

$.extend(TimeSelector.prototype, {	
	init: function (target, options, callback) {
		if ( ! target) {
			return;
		}
				
		// Callback
		$(target).data('callback', callback);

		$(target).data('has_adjustment', false);

		// Configure Target
		if (options.format) {
			$(target).data('format', options.format);
		}
		else {
			$(target).data('format', this.format);		
		}
		
		// Save Constrain
		if (options.adjust) {
			$(target).data('adjust', options.adjust);
			
			if (options.adjustType) {
				$(target).data('adjustType', options.adjustType);
			}
			else {
				$(target).data('adjustType', 'hour');
			}
			
			if (options.adjustValue) {
				$(target).data('adjustValue', options.adjustValue);
			}
			else {
				$(target).data('adjustValue', 1);
			}
		}

		// Analyze Timestamp
		this.analyze_format(target);

		// This ain't regular text
		$(target).attr('spellcheck', 'false');

		// Load information about field		
		if (options.timestamp) {
			this.read(target, options.timestamp);
		}
		else {
			this.read(target);
		}
		
		// Bind Events to Input		
		$(target).bind('blur.dataEntry', this.blur_event);
		
		$(target).bind('click.dataEntry', this.click_event);
		
		$(target).bind('keydown.dataEntry', this.keydown_event);
		
		$(target).bind('keypress.dataEntry', this.keypress_event);
		
		// Allow mouse wheel usage
		if ( ! options.mousewheel && $.fn.mousewheel) {
			$(target).mousewheel(this.mousewheel_event);
		}
	},
	
	read: function(target, stamp) {
		if ( ! stamp) {
			stamp = $(target).attr('ref');
		}
		
		var format = $(target).data('format');

		stamp = this.unix_timestamp(stamp);

		if ( ! stamp)
		{
			stamp = this.unix_timestamp();
		}

		timestamp = this.format_date(format, stamp);		
		
		$(target).data('timestamp', stamp);
		$(target).val(timestamp);
	},
	
	// ! Date Functions
	
	analyze_format: function (target) {
		var format_string = $(target).data('format');
		var length = format_string.length;
		var new_format_string = '';
		var ranges = [];
		var diff = 0;
		
		for(i = 0; i < length; i++) {
			char = format_string.charAt(i);

			switch(char) {
				case 'm':
				case 'd':
				case 'h':
				case 'i':
				case 'a':
				case 's':
					ranges.push({
						start: i+diff,
						end: i+diff+2,
						char: char
					});

					new_format_string += char+char;
					diff += 1;
				break;

				case 'Y':
					ranges.push({
						start: i+diff,
						end: i+diff+4,
						char: char
					});

					new_format_string += char+char+char+char;
					diff += 3;
				break;
								
				default:
					new_format_string += char;
				break;
			}
		}
				
		$(target).data('format', new_format_string);
		$(target).data('ranges', ranges);
	},

	format_date: function (format, stamp) {
		if ( ! stamp) {
			var stamp = this.unix_timestamp(stamp);
		}
		
		console.log(stamp);
		
		var date   		= format;
	
		// replace year
		date       		= date.replace(/YYYY/, stamp.fullyear);
		
		// replace month
		date       		= date.replace(/mm/, stamp.month < 10 ? '0' + stamp.month : stamp.month);
		
		// replace date
		date       		= date.replace(/dd/, stamp.day < 10 ? '0' + stamp.day : stamp.day);
		
		// replace hours
		date       		= date.replace(/HH/, stamp.hours24 < 10 ? '0' + stamp.hours24 : stamp.hours24);
		date       		= date.replace(/hh/, stamp.hours12 < 10 ? '0' + stamp.hours12 : stamp.hours12);
		
		// replace minutes
		date       		= date.replace(/ii/, stamp.minutes);
		
		// replace seconds
		date       		= date.replace(/ss/, stamp.seconds);

		// replace am/pm
		date       		= date.replace(/AA/, stamp.ampm);
		date       		= date.replace(/aa/, stamp.ampm.toLowerCase());

		return date;
	},
	
	unix_timestamp: function () {
		var date    = new Date();

		if (arguments[0]) {
			if (typeof arguments[0] != 'Object') {
				if (arguments[0] <= 2147483646) {
					date.setTime(arguments[0] * 1000);			
				}
				else
				{
					date.setTime(arguments[0]);		
				}
			}
			else
			{
				date = arguments[0];
			}
		}
		
		var timestamp = parseInt(Date.UTC(
			date.getFullYear(), 
			date.getMonth(), 
			date.getDate(), 
			date.getHours(), 
			date.getMinutes()
		));
		
		return {
			'jsTimestamp': timestamp,
			'timestamp': timestamp / 1000,
			'date': date,
			'fullyear': date.getFullYear(),
			'shortyear': date.getFullYear()[2] + date.getFullYear()[3],
			'month': date.getMonth()+1,
			'day': date.getDate(),
			'hours24': date.getHours(),
			'hours12': date.getHours() >  12 ? (date.getHours() - 12) : ((hours = date.getHours()) == 0 ? '12' : hours),
			'minutes': date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes(),
			'seconds': date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds(),
			'ampm': date.getHours() > 11 ? 'pm' : 'am'
		};	
	},
	
	// ! Misc
	
	change_format: function (target, format) {
		$(target).data('format', format);
		
		$.timeSelector.analyze_format(target);
		format = $(target).data('format');
		
		var stamp = $(target).data('timestamp');
		var timestamp = $.timeSelector.format_date(format, stamp);

		$(target).val(timestamp);		
	},
	
	timestamp: function (target) {
		return $(target).data('timestamp');
	},
	
	apply_range: function (target) {
		var ranges = $(target).data('ranges');
		var range;
				
		if ( ! (range = ranges[$(target).data('current_range')]))
		{
			range = ranges[0];
		};

		target.setSelectionRange(range.start, range.end);
	},
	
	adjust_time: function (target, increment, value) {
		var format = $(target).data('format');
		
		var ranges = $(target).data('ranges');
		var selected = $(target).data('current_range');
		
		if ( ! ranges[selected] && ! ranges[0]) {
			return;
		}
		else if ( ! ranges[selected])
		{
			selected = 0;
		}
		 
		var char = ranges[selected].char;
		var stamp = $(target).data('timestamp');
		var date = stamp.date;
		
		switch(char) {
			case 'm':
				if (value) {
					value = parseInt(value);
					var month = parseInt(date.getMonth()+1);
					var year = date.getFullYear();
					
					if (month == 1 && (value == 1 || value == 2)) {
						month = '1'+value;
					}
					else
					{
						month = value;
					}
															
					date.setMonth(month-1);
					date.setFullYear(year);
				}
				else
				{
					date.setMonth(date.getMonth()+increment);
				}
			break;
			
			case 'd':
				if (value) {
					value = parseInt(value);
					var day = date.getDate();
					var month = date.getMonth();
					var year = date.getFullYear();
					var total_days = (32 - new Date(year, month, 32).getDate());
						
					if (total_days == 31 && day == '3' && (value == '1' || value == '0')) {
						day = '3'+value;
					}
					else if (total_days == 30 && day == '3' && value == '0') {
						day = '30';
					}
					else if (total_days == 28 && day == '2' && value == '8') {
						day = '28';
					}
					else if (day < 3) {
						day = day+''+value;
					}
					else
					{
						day = value;
					}	
					
					
					date.setDate(day);
					date.setMonth(month);
					date.setFullYear(year);
				}
				else
				{
					date.setDate(date.getDate()+increment);
				}
			break;
			
			case 'h':
				if (value) {
					value = parseInt(value);
					var hour = parseInt(date.getHours());
					var day = date.getDate();
					var month = date.getMonth();
					var year = date.getFullYear();
					
					if (hour == 1 && (value == 1 || value == 2)) {
						hour = '1'+value;
					}
					else
					{
						hour = value;
					}
					
					date.setHours(hour);
					date.setDate(day);
					date.setMonth(month);
					date.setFullYear(year);
				}
				else
				{
					date.setHours(date.getHours()+increment);
				}
			break;
			
			case 'i':
				if (value) {
					value = parseInt(value);
					var minutes = parseInt(date.getMinutes());
					var hour = date.getHours();
					var day = date.getDate();
					var month = date.getMonth();
					var year = date.getFullYear();
					
					if (minutes < 6) {
						minutes = minutes+''+value;
					}
					else
					{
						minutes = value;
					}

					date.setMinutes(minutes);
					date.setHours(hour);
					date.setDate(day);
					date.setMonth(month);
					date.setFullYear(year);
				}
				else
				{
					date.setMinutes(date.getMinutes()+increment);
				}
			break;
			
			case 's':
				if (value) {
					value = parseInt(value);
					var seconds = parseInt(date.getSeconds());
					var minutes = date.getMinutes();
					var hour = date.getHours();
					var day = date.getDate();
					var month = date.getMonth();
					var year = date.getFullYear();
					
					if (seconds < 6) {
						seconds = seconds+''+value;
					}
					else
					{
						seconds = value;
					}

					date.setSeconds(seconds);
					date.setMinutes(minutes);
					date.setHours(hour);
					date.setDate(day);
					date.setMonth(month);
					date.setFullYear(year);
				}
				else
				{
					date.setSeconds(date.getSeconds()+increment);
				}
			break;
			
			case 'Y':
				if (value) {
					value = parseInt(value);
					var year = parseInt(date.getFullYear());
					
					if (year < 999) {
						year = year+''+value;
					}
					else
					{
						year = value;
					}
					
					date.setFullYear(year);
				}
				else
				{
					date.setFullYear(date.getFullYear()+increment);
				}
			break;
			
			case 'a':
				if (value) {
					var hour = parseInt(date.getHours());
					var day = date.getDate();
					var month = date.getMonth();
					var year = date.getFullYear();

					if (value === 'a' || value === 'A') {
						if (hour > 12) {
							hour -= 12;
						}
					}
					else if (value === 'p' || value === 'P') {
						if (hour < 12) {
							hour += 12;
						}
					}
					
					date.setHours(hour);
					date.setDate(day);
					date.setMonth(month);
					date.setFullYear(year);
					
					date.setFullYear(year);
				}
				else
				{
					var ampm = stamp.ampm;
					var hour = parseInt(date.getHours());
					
					if (ampm === 'am') {
						hour += 12;
					}
					else{
						hour -= 12;
					}
					
					date.setHours(hour);
				}
			break;
		}

		var stamp = $.timeSelector.unix_timestamp(date);
							
		var callback = $(target).data('callback');

		if (callback) {
			callback(stamp);
		}

		$(target).data('timestamp', stamp);
		timestamp = $.timeSelector.format_date(format, stamp);
								
		$(target).val(timestamp);
		$(target).data('has_adjustment', true);		
	},
	
	set_time: function(target, date) {
		var format = $(target).data('format');
		var stamp = $.timeSelector.unix_timestamp(date);
		var timestamp = $.timeSelector.format_date(format, stamp);

		$(target).val(timestamp);		
	},
	
	// ! Events
	blur_event: function () {
		$(this).data('current_range', false);

		if ($(this).data('has_adjustment') === true) {
			// Adjust Elements to other fields
			var adjustElement = $(this).data('adjust');
			var stamp = $(this).data('timestamp');
			
			if (adjustElement) {
				var startUTC = stamp.timestamp;
				var endUTC = $.timeSelector.timestamp(adjustElement).timestamp;
				var adjustType = $(this).data('adjustType');
				var adjustValue = $(this).data('adjustValue');
								
				if ((startUTC >= endUTC && adjustValue > 0) || (startUTC <= endUTC && adjustValue < 0)) {
					switch(adjustType.toLowerCase()) {
						case 'month':
							stamp.date.setMonth(stamp.date.getMonth()+adjustValue);
						break;
						
						case 'date':
						case 'day':
							stamp.date.setDate(stamp.date.getDate()+adjustValue);
						break;
						
						case 'year':
							stamp.date.setFullYear(stamp.date.getFullYear()+adjustValue);
						break;
						
						case 'hour':
							stamp.date.setHours(stamp.date.getHours()+adjustValue);
						break;
						
						case 'minute':
							stamp.date.setMinutes(stamp.date.getMinutes()+adjustValue);
						break;
					}
					
					$.timeSelector.set_time(adjustElement, stamp.date);
				}
			}
			
			$(this).data('has_adjustment', false);
		}
	},
	
	click_event: function () {
		var start = 0;
		var end = 2;
		
		if (this.selectionStart != null) {
			var ranges = $(this).data('ranges');
			var format = $(this).data('format');
			$(this).data('current_range', 0);
			var char = format[this.selectionStart];	

			for (var i = 0; i < ranges.length; i++) {
				if (ranges[i]['char'] == char)
				{
					$(this).data('current_range', i);
					break;
				}
			}
		}

		$.timeSelector.apply_range(this);

	},
	
	keydown_event: function (event) {
		var current_range = $(this).data('current_range');
		var range_length = $(this).data('ranges').length;

		if (event.keyCode == 13) {
			return true;
		}

		if (event.keyCode == 9) {
			if(current_range > (range_length - 1)) {
				return true;
			}
			
			$(this).data('current_range', current_range + 1);
			$.timeSelector.apply_range(this);
		}

		if (event.keyCode >= 48) { // >= '0'
			return true;
		}

		switch(event.keyCode) {
			//Move to previous field
			case 37:
				if(current_range == 0) {
					current_range = range_length;
				}
				
				$(this).data('current_range', current_range - 1);
				$.timeSelector.apply_range(this);
			break;

			// Move to next field
			case 39:
				if(current_range > (range_length - 1)) {
					current_range = 0;
				}
				
				$(this).data('current_range', current_range + 1);
				$.timeSelector.apply_range(this);
			break;
			
			// Increment time up
			case 38:
				$.timeSelector.adjust_time(this, 1);
			break;

			// Increment time down
			case 40:
				$.timeSelector.adjust_time(this, -1);
			break;
		}

		$.timeSelector.apply_range(this);
		
		return false;
	},
	
	keypress_event: function (event) {
		var chr = String.fromCharCode(event.charCode == undefined ? event.keyCode : event.charCode);
		var ranges = $(this).data('ranges');
		var current = $(this).data('current_range');
		var range = ranges[current];

		if (range.char == 'a' && (chr === 'a' || chr === 'A' || chr === 'p' ||chr === 'P' )) {
			$.timeSelector.adjust_time(this, null, chr);
		}

		if (chr < ' ') {
			return true;
		}
		
		if (chr >= '0' && chr <= '9') {
			$.timeSelector.adjust_time(this, null, chr);
		}
				
		$.timeSelector.apply_range(this);
		
		return false;
	},
	
	mousewheel_event: function (event, delta) {
		delta = ($.browser.opera ? -delta / Math.abs(delta) :
			($.browser.safari ? delta / Math.abs(delta) : delta));
			
		$.timeSelector.adjust_time(this, delta);
		$.timeSelector.apply_range(this);
		
		return false;
	}
});

$.timeSelector = new TimeSelector();

$.fn.timeSelector = function(options, callback) {
	return this.each(function() {
		var nodeName = this.nodeName.toLowerCase();

		if ( ! options) {
			options = {};
		}

		if (nodeName == 'input') {
			$.timeSelector.init(this, options, callback)	
		}
	});
}

})(jQuery);