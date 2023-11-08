### Features

- Budget deployment compatible.
- Light weight.
- Node based.
- File driven.

# PV

**Table of Contents**

#Project [homepage](https://www.projectvar.com "Heading link")

#Alpine Install
apk add redis
rc-update add redis boot

#Alpine Proxy
apk add nginx
rc-update add nginx boot

#Run
npm install -g forever

# Sample Node
{
	
	"message": "Our online ordering website has been reconfigured to work properly.",
	
	"host": "www.projectvar.com",
	"copyright": "Tudays (2 Day Deli)",
	"title": "PVAR",
	"description": "A website.",
	"keywords": ["This", "That"],
	"author": "Alain Mena Galindo",
	"logo": "/cdn/logo.svg?v=0.1",
	"favicon": "/cdn/fav.svg?v=0.aassddddeed",
	"image": {
		"src": "https://firebasestorage.googleapis.com/v0/b/turn-4fba8.appspot.com/o/cdn%2Fcuban-hifi.jpg?alt=media&token=f388b24d-3985-430c-851c-8b5feb502c58"
	},
	
	"gtag": "G-Y56DE99JJS",
	
	"background": {"color": "#3c3b6e"},
	"colors": {"links": "#2196F3"},
	
	"store": "https://2daydeli.square.site/s/order?location=11ea32cf6b94857aa1470cc47a2aeaec",
	
	"menu": {
		"src": "/nodes/data/menu-main.json",
		"snippet": { "src": "/nodes/snippet.html" }
	},
	
	"toolbar": {
		"enabled": false
	}
	
	"qr": {
		"office": {
			"redirect": "/office"
		},
		"resell": {
			"redirect": "/resell"
		},
		"store": {
			"redirect": "/store"
		}
	},
	
	"wifi": {
		"name": "Tudays (Guest)",
		"password": "1234567890"
	},

	"hours": {
		"memo": "We're open <b>Fridays and Saturdays</b><div>from <b>8 AM to 3 PM</b>.</div>",
		"open": {
			"Thu": ["08:00:00", "15:00:00"],
			"Fri": ["08:00:00", "15:00:00"],
			"Sat": ["08:00:00", "15:00:00"]
		},
		"days": {
			"Sunday": "Closed",
			"Monday": "Closed",
			"Tuesday": "Closed",
			"Wednesday": "Closed",
			"Thursday": "Closed",
			"Friday": "8 AM - 3PM",
			"Saturday": "8 AM - 3PM"
		}
	},
	
	"contact": [{
		"name": "Main Line (Call or Text)",
		"phone": "(727) 123-4567",
		"location": {
			"street": "7108 9th Ave. N",
			"city": "St. Petersburg",
			"state": "FL",
			"zipcode": "33710",
			"csz": "St. Petersburg, FL 33710",
			"link": "https://www.google.com/maps/place/Tudays+(2+Day+Deli)/@27.7805846,-82.7392571,17z/data=!4m12!1m6!3m5!1s0x88c2e3cd0868ed53:0x1a4b59a0cd9aa6c4!2sTudays+(2+Day+Deli)!8m2!3d27.7805799!4d-82.7370631!3m4!1s0x88c2e3cd0868ed53:0x1a4b59a0cd9aa6c4!8m2!3d27.7805799!4d-82.7370631",
			"_map": {
				"src": "/cdn/pinellas-trail-tudays-deli.svg",
				"src": "/cdn/tudays.svg?v=0.123d"
			}
		}
	}],
	
	"payment": {
		"memo": "We accept cash, Apple Pay, Google Pay, and all major credit cards.",
		"methods": {
			"apple": {},
			"google": {},
			"visa": {},
			"mc": {},
			"discover": {},
			"ae": {}
		}
	},
	
	"tritips": [
		{
			"title": "Business",
			"data": [{
				"title": "About",
				"href": "/about"
			}, {
				"title": "Contact",
				"href": "/contact"
			}, {
				"title": "Gift Cards",
				"target": "_new",
				"href": "https://wallet.oryk.com/?m=&network=tudays"
			}, {
				"title": "Jobs",
				"target": "_new",
				"href": "https://docs.google.com/forms/d/e/1FAIpQLSez6Ax1Z8zCDSA2MOEiUXR7SAklUQie8avJfOj4fCGtsxFZ0A/viewform"
			}]
		}, 
		{
			"title": "Brand",
			"data": [{
				"title": "Locations",
				"href": "/locations"
			}, {
				"title": "Resell Products",
				"href": "/resell"
			}]
		}
	]
	
}
