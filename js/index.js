$(document).ready(function() {
	$('.outline-image').click(function() {
		$('.outline-image').removeClass('outline-image-selected');
		$(this).addClass('outline-image-selected');
	});
	$('.prev-step').click(function() {
		$('.first-step').removeClass('hidden');
		$('.second-step').addClass('hidden');
	});
	$('.go-second-step').click(function() {
		$('.second-step').removeClass('hidden');
		$('.third-step').addClass('hidden');
	});
	$('.go-third-step').click(function() {
		$('.second-step').addClass('hidden');
		$('.third-step').removeClass('hidden');
	});
});