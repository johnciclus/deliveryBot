module.exports = {
	isoString: function(date) {
		if (date) {
			dDate = new Date(date);
			return dDate.toISOString();
		} else {
			date = new Date();
			return date.toISOString();
		}

	},

	dateString: function(isoDate) {
		if (isoDate) {
			return new Date(isoDate);
		} else {
			return new Date();
		}

	},

	isoTimeDiff: function(isoDate1, isoDate2) {

		if (!isoDate1) {
			return 0;
		}

		var seconds1, seconds2;
		if (!isoDate2) {
			isoDate2 = new Date();
			seconds1 = new Date(isoDate1).getTime() / 1000;
			seconds2 = isoDate2.getTime() / 1000;
		} else {
			seconds1 = new Date(isoDate1).getTime() / 1000;
			seconds2 = new Date(isoDate2).getTime() / 1000;
		}

		return (seconds1 - seconds2);

	},

	timeDiff: function(time1, time2) {
		var seconds1, seconds2;
		if (!time1) {
			return 0;
		} else {
			if (time2) {
				seconds1 = new Date(time1).getTime() / 1000;
				seconds2 = new Date(time2).getTime() / 1000;

			} else {
				seconds1 = new Date(time1).getTime() / 1000;
				seconds2 = new Date().getTime() / 1000;

			}
		}
		return (seconds1 - seconds2);

	}
}