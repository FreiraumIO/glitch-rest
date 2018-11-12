1) install this repo on a glitch as in https://glitch.com/edit/#!/hallowed-train - this will sync zoho data to firebase

locally:

2) install chrome and start with no security (otherwise link highlighting does not work in google for example):

      "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:/ChromeDevSession"
 
   best: create a "Verknüfung" with this variables
   
3) copy tamperMonkeyLinkHighlighter script to your tampermonkey in the chrome of step 2

4) in tamperMonkeyLinkHighlighter set the firebase config and account/login username and pwd
