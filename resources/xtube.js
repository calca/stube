(function () {

    var App = {
		videoURL: 'http://gdata.youtube.com/feeds/api/videos',
		apiKey: "6785e178f3abeda99a74ac34260d4615",
		urlAPI: "http://api.musixmatch.com/ws/1.1/"
	};

	var Slider = function(){
		var self = this;
		this.Destory = function(){
			if(self.slider){
				self.slider.destroyShow();
			}
		}
		this.Create = function(){
		// show slider
		self.slider = $('#slider').bxSlider({
							displaySlideQty: 6,
							moveSlideQty: 5,
							infiniteLoop: false
						});
		}
	}

	var View = function(){
		var self = this;
		
		this.searchText = ko.observable();
		this.Current =  {
				Title: ko.observable(),
				Lyrics: ko.observableArray()
			}
		this.Selected = {
			Title: ko.observable(),
			Cover: ko.observable(),
			Album: ko.observable(),
			Artist: ko.observable(),
			Text: ko.observable(),
		}
		this.Videos = ko.observableArray();

		this.singleLyric = ko.observable(false);

		this.showLyricsList = function(){
			self.singleLyric(false);
		}
		
		this.clickOnSearch = function(){
			var t = this.searchText();
			this.searchText('');

			var p = {
				q: t,
				v: 2,
				category: 'music',
				alt: 'json-in-script'
			};
			
			$.ajax({
				  url: App.videoURL,
				  data: p,
				  crossDomain: true,
				  dataType: 'jsonp',
				  success: App.SearchVideoResult
				});

		}
		
		this.showTrack = function(ele){
			var url = App.urlAPI + "track.lyrics.get";
			var p = {
				apikey: App.apiKey,
				track_id: ele.Trackid,
				format: 'jsonp'
			}
			
			$.ajax({
				  url: url,
				  data: p,
				  crossDomain: true,
				  dataType: 'jsonp',
				  success: function(data){ App.ShowLyricResult(data,ele); }
				});
		}
		
		this.showVideo = function(ele,event,nochange){
			self.Current.Title(ele.Title);
			$('#videoPlayer').show().tubeplayer('play', ele.Videoid);
			
			var url = App.urlAPI + "track.search";
			var p = {
				apikey: App.apiKey,
				q: ele.Title,
				quorum_factor: 0.6,
				format: 'jsonp'
			}
			
			$.ajax({
				  url: url,
				  data: p,
				  crossDomain: true,
				  dataType: 'jsonp',
				  success: App.SearchLyricResult
				});

			//
			if(!nochange){
				var match = ko.utils.arrayFirst(
						App.View.Videos(), function(item) { 
							return item.Selected() == true 
						})
				if(match) {
					var index = App.View.Videos.indexOf(match);
					 App.View.Videos()[index].Selected(false);
					}

				var match2 = ko.utils.arrayFirst(
						App.View.Videos(), function(item) { return item.Videoid ==  ele.Videoid })
				if(match2){
					var index2 = App.View.Videos.indexOf(match2);
					App.View.Videos()[index2].Selected(true);
				} 
			}
		}
	}
	
	$(document).ready(function (){
		App.Init();
	});

	App.Init = function(){
		App.Slider = new Slider();
		App.View = new View();
		ko.applyBindings(App.View);
		
		$('#videoPlayer').hide().tubeplayer({
			width: 600, // the width of the player
			height: 450, // the height of the player
			allowFullScreen: "true", // true by default, allow user to go full screen
			autoPlay: "true"
		});
	}
	
	App.SearchVideoResult = function(data){
		
		App.View.Videos.removeAll();
		App.Slider.Destory();
		App.View.singleLyric(false);

		var res = data.feed.entry;
		if (res){
			var l = res.length -1;
			
			for(; l > 0; l--){
				var item = res[l];
				App.View.Videos.push({
					Thumb: item.media$group.media$thumbnail[1].url,
					Title: item.title.$t,
					Videoid: item.media$group.yt$videoid.$t,
					Selected: ko.observable(false)
				});
			}

			// show current
			App.View.Videos()[0].Selected(true);
			App.View.showVideo({
				Title: res[0].title.$t,
				Videoid: res[0].media$group.yt$videoid.$t
			},undefined,true);

			App.Slider.Create();
		}
	}
	
	App.SearchLyricResult = function(data){
		var list = data.message.body.track_list;
		var l = list.length -1;

		App.View.singleLyric(false);
		App.View.Current.Lyrics.removeAll();

		for(; l > 0; l--){
			var item = list[l].track;
			App.View.Current.Lyrics.push({
				Title: item.track_name,
				Album: item.album_name,
				Artist: item.artist_name,
				Cover: item.album_coverart_100x100,
				Trackid: item.track_id
			})
		}
	}
	
	App.ShowLyricResult = function(data,ele){
		if(data.message.body.length == 0){
			// nodata
			return;
		}

		var ly = data.message.body.lyrics.lyrics_body;
		if(ly){
				App.View.Selected.Text(ly);
				App.View.Selected.Title(ele.Title);
				App.View.singleLyric(true);
		}
		
	}
		
})();
	
	
