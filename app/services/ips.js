import Ember from 'ember';

export default Ember.Service.extend({
  getLocalIps : function () {
    return new Ember.RSVP.Promise(function (resolve, reject) {
      var ip_dups = {};

       //compatibility for firefox and chrome
       var RTCPeerConnection = window.RTCPeerConnection
           || window.mozRTCPeerConnection
           || window.webkitRTCPeerConnection;
       var useWebKit = !!window.webkitRTCPeerConnection;

       //bypass naive webrtc blocking using an iframe
       if(!RTCPeerConnection){
           //NOTE: you need to have an iframe in the page right above the script tag
           //
           //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
           //<script>...getIPs called in here...
           //
           var win = iframe.contentWindow;
           RTCPeerConnection = win.RTCPeerConnection
               || win.mozRTCPeerConnection
               || win.webkitRTCPeerConnection;
           useWebKit = !!win.webkitRTCPeerConnection;
       }

       //minimal requirements for data connection
       var mediaConstraints = {
           optional: [{RtpDataChannels: true}]
       };

       var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

       //construct a new RTCPeerConnection
       var pc = new RTCPeerConnection(servers, mediaConstraints);
       var ips = [];

       function handleCandidate(candidate){
           //match just the IP address
           var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
           var ip_addr = ip_regex.exec(candidate)[1];

           //remove duplicates
           if(ip_dups[ip_addr] === undefined) {
             ips.push(ip_addr);
             if (ips.length === 2) {
               resolve(ips);
             }
           }

           ip_dups[ip_addr] = true;
       }

       //listen for candidate events
       pc.onicecandidate = function(ice){
           //skip non-candidate events
           if(ice.candidate) {
             handleCandidate(ice.candidate.candidate);
           }
       };

       //create a bogus data channel
       pc.createDataChannel("");

       //create an offer sdp
       pc.createOffer(function(result){
           //trigger the stun server request
           pc.setLocalDescription(result, function(){}, function(){});
       }, function(){});

       //wait for a while to let everything done
       setTimeout(function(){
           //read candidate info from local description
           var lines = pc.localDescription.sdp.split('\n');

           lines.forEach(function(line){
               if(line.indexOf('a=candidate:') === 0) {
                 handleCandidate(line);
               }
           });
       }, 1000);
    });
  }
});
