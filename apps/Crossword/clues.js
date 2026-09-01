var ttss = [
		{
			word: "sale",
			clue: "セール: They bought a lot of items at the summer (セール).",
		},
		{
			word: "in search of",
			clue: "～を探しに: Many animals travel (～を探しに) food and water.",
		},
		{
			word: "tiny",
			clue: "とても小さい: An ant is a (とても小さい) insect.",
		},
		{
			word: "largest",
			clue: "最も(一番)大きな: The blue whale is the (一番大きな) animal in the world.",
		},
		{
			word: "insect",
			clue: "昆虫: A butterfly is a beautiful (昆虫).",
		},
		{
			word: "beast",
			clue: "けもの・動物: The lion is known as a powerful (けもの・動物).",
		},
		{
			word: "migration",
			clue: "動物の大移動: The birds' (動物の大移動) happens every autumn.",
		},
		{
			word: "take a look",
			clue: "見てみよう: Let's (見てみよう) at this map together.",
		},
		{
			word: "journey",
			clue: "長い旅: The travelers packed their bags for a long (長い旅).",
		},
		{
			word: "northern",
			clue: "北の: Canada is located in the (北の) part of America.",
		},
		{
			word: "and back",
			clue: "(行って) 戻って: They flew to London (行って戻って) in one week.",
		},
		{
			word: "whole",
			clue: "全部の: He ate the (全部の) cake by himself.",
		},
		{
			word: "generation",
			clue: "世代: This secret recipe was passed down to the next (世代).",
		},
		{
			word: "wide",
			clue: "幅～の: The river is about fifty meters (幅～の).",
		},
		{
			word: "brain",
			clue: "脳: Use your (脳) to solve this puzzle.",
		},
		{
			word: "where to",
			clue: "～する場所・ どこに～するか: The birds always know (どこに〜するか) fly.",
		},
		{
			word: "even",
			clue: "～でさえ: It is cold here (〜でさえ) during the summer.",
		},
		{
			word: "North Pole",
			clue: "北極: Polar bears live near the (北極).",
		},
		{
			word: "migrate",
			clue: "渡る・移動する: Some whales (移動する) to warmer waters to have babies.",
		},
		{
			word: "gazelle",
			clue: "ガゼル: The hungry cheetah ran fast after a (ガゼル).",
		},
		{
			word: "place",
			clue: "場所: Kyoto is a wonderful (場所) to visit.",
		},
		{
			word: "born",
			clue: "生まれた: Sea turtles always return to where they were (生まれた).",
		},
	],
	appdata = { maincolor: "#a3f7a", qcount: 22 };
function saveData() {
	localStorage.setItem("ttsasyik", JSON.stringify(appdata));
}
function startttsgame() {
	for (var e, t = [], o = [], a = 0; a < appdata.qcount; a++) {
		var n = ((e = ttss.length), Math.floor(Math.random() * e)),
			i = ttss[n];
		(t.push(i.word), o.push(i.clue), ttss.splice(n, 1));
	}
	var r = new Crossword(t, o),
		s = r.getSquareGrid(10);
	if (null != s) {
		((document.getElementById("crossword").innerHTML = CrosswordUtils.toHtml(
			s,
			!0,
		)),
			(function (e) {
				for (var t in e) {
					for (var o = [], a = 0; a < e[t].length; a++)
						o.push(
							"<li><strong>" +
								e[t][a].position +
								".</strong> " +
								e[t][a].clue +
								"</li>",
						);
					document.getElementById(t).innerHTML = o.join("\n");
				}
			})(r.getLegend(s)));
	} else {
		var c = r.getBadWords(),
			d = [];
		for (a = 0; a < c.length; a++) d.push(c[a].word);
		location.reload();
	}
}
function setqcount(e) {
	((appdata.qcount = e), saveData(), location.reload());
}
function resetsettings() {
	(localStorage.clear(), location.reload());
}
function tsep(e) {
	return e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function vtext(e) {
	return !!e.match(/^[A-Za-z0-9]+$/);
}
function toggledrawer() {
	$("#drawer").toggle();
}
function removeads() {
	try {
		Android.removeAds();
	} catch (e) {
		console.log(e);
	}
}
function rateapp() {
	try {
		Android.rateApp();
	} catch (e) {
		console.log(e);
	}
}
null === localStorage.getItem("ttsasyik")
	? saveData()
	: (appdata = JSON.parse(localStorage.getItem("ttsasyik")));
var canswershown = !1;
function toggleAnswer() {
	(canswershown
		? ($(".canswer").hide(), $(".uanswer").show(), (canswershown = !1))
		: ($(".canswer").show(), $(".uanswer").hide(), (canswershown = !0)),
		ciihuy.showAd());
}
function activatetts() {
	$("td").click(function () {
		"&nbsp;" != $(this).find(".canswer").html() &&
			null != $(this).find(".canswer").html() &&
			(console.log("Clicked: " + $(this).find(".canswer").html()),
			console.log($(this).find(".uanswer").attr("id")),
			(selectedua = $(this).find(".uanswer").attr("id")),
			$("#vkeyboard").show());
	});
}
var selectedua = -1;
function typechar(e) {
	($("#" + selectedua).html(e), $("#vkeyboard").hide());
}
function initvkeyboard() {
	for (
		var e = [
				"a",
				"b",
				"c",
				"d",
				"e",
				"f",
				"g",
				"h",
				"i",
				"j",
				"k",
				"l",
				"m",
				"n",
				"o",
				"p",
				"q",
				"r",
				"s",
				"t",
				"u",
				"v",
				"w",
				"x",
				"y",
				"z",
				"-",
				"\u00A0",
			],
			t = 0;
		t < e.length;
		t++
	)
		$("#kbtnlist").append(
			"<div class='kbtn' onclick=typechar('" + e[t] + "')>" + e[t] + "</div>",
		);
}
setTimeout(function () {
	(startttsgame(),
		activatetts(),
		initvkeyboard(),
		$("#crossword").css({
			width: 32 * $("tbody:eq(0)").find("tr:eq(0)").find("td").length + "px",
		}),
		$("#game").show());
}, 1500);
