// ==========================================================================
// SCROLLER
// ==========================================================================

(function() {
	
	var stoppers = '.no-scroll, .noscroll, .modal';
	var did = false;
	
	var Modernizr = Modernizr || null;
	
	// Skip Smartphones
	if (Modernizr) {
		
		if (!Modernizr.touch) {
			debiki.Utterscroll.enable({
				scrollstoppers: stoppers
		   }); did = true;
	   }
		
	} else {
		debiki.Utterscroll.enable({
			scrollstoppers: stoppers
	   }); did = true;
	}
	
	if (did) jQuery('body').attr('data-utterscroll', true).css('cursor', '-webkit-grab');
	   
})();