/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const rp = require('request-promise');

// Helper function that posts to Slack about the new issue
const createIssue = (issueTitle, issueMessage) => {
  // See https://developer.github.com/v3/issues/#create-an-issue on how
  // to customize the message payload
  var issueReq = rp({
    method: 'POST',
    uri: functions.config().github.base_url + '/repos/' + functions.config().repo.owner + '/' +  functions.config().repo.repo_name + '/issues',
	qs: {
        access_token: functions.config().github.token	// -> uri + '?access_token=xxxxx%20xxxxx'
    },
    body: {
      title: issueTitle,
	  body: issueMessage,
	  labels: [
		functions.config().issue.lable
	  ]
    },
	headers: {
		"User-Agent": "Firebase-Cloud-Functions",
        "Accept" : "application/vnd.github.v3+json",
		"Content-Type" : "application/json"
    },
    json: true,
  });
  
  console.log(issueReq);
  return issueReq;
};

exports.postOnNewIssue = functions.crashlytics.issue().onNew((issue) => {
	
  var issueId = issue.issueId;
  var issueTitle = issue.issueTitle;
 
  var appId= issue.appInfo ? issue.appInfo.appId: "";
  var appName = issue.appInfo ? issue.appInfo.appName : "";
  var appPlatform = issue.appInfo ? issue.appInfo.appPlatform : "";
  var latestAppVersion = issue.appInfo ? issue.appInfo.latestAppVersion : "";

  // Prepare the issue text.
  var title = `${functions.config().issue.title} - ${issueTitle} (${issueId})` ;
  var message = `${functions.config().issue.body}
  
  Crash report : [Firebase Console Link](https://console.firebase.google.com/u/0/project/${process.env.GCLOUD_PROJECT}/crashlytics/app/${appPlatform}:${appId}/issues/${issueId})
  
  ### Application Info:\n
  **Application name**: ${appName}(${appId}) 
  **Version**: ${latestAppVersion} on ${appPlatform}`;
  
  return createIssue(title, message).then(() => {
    return console.log(`Posted new issue ${issueId} successfully to GitHub`);
  });
});