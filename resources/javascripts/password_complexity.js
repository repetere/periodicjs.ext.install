'use strict';

// Weak requires a password 8 characters in length with at least 1 uppercase letters and one lower case character
// Medium requires a password 8 characters in length with at least 1 uppercase letters, one lower case character and one special character or number
// Strong requires a password 8 characters in length with at least 1 uppercase letters, one lower case character and one special character and number
module.exports = function (str, option) {
	var level;
	switch (option.toLowerCase()) {
	case 'weak':
		level = 1;
		break;
	case 'medium':
		level = 2;
		break;
	case 'strong':
		level = 3;
		break;
	default:
		level = 1;
		break;
	}
	var weak = /(?=.{8,})(?=.*[A-Z])(?=.*[a-z]+)/,
		medium = /(?=.{8,})(?=.*[A-Z])(?=.*[a-z]+)(?=.*\d+)/,
		strong = /(?=.{8,})(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z])/,
		flag;
	if (weak.test(str) && level <= 1) {
		flag = 'weak';
	}
	if ((medium.test(str)) && level <= 2) {
		flag = 'medium';
	}
	if (strong.test(str) && level <= 3) {
		flag = 'strong';
	}
	if (!flag) {
		flag = false;
	}
	return flag;
};
