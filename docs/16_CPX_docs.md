1:
CPX Research - Script Tag Documentation
We recommend integrating our script tag solution. Try to find a space on your website that is often seen by users to generate higher revenues (e.g. your side bar). This page explains how you can integrate the script tag. There are different designs to display our surveys.

Name	Screenshot
Design 1 - Full Content Widget	Screenshot
Design 2 - Multi Sidebar Widget	Screenshot
Design 3 - Single Sidebar Widget	Screenshot
Design 4/5 - Notification	Screenshot
Version :	v1.1
Last Update :	30-06-2020
Step 1
Please add the following Javascript Library to your source code. It is important that you add this code in the footer just before the </body>

															

															<script type="text/javascript" src="https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js"></script>



                                                        
Step 2
Please add the following configuration to your script:

1. Its important that you insert the following script tag right in front of the the Library from Step 1
2. You can use multiple of the designs on one page -> example full content element with sidebar element can be combined
3. If you want use Design 1 -> use const script1
4. If you want use Design 2 -> use const script2
5. If you want use Design 3 -> use const script3
5. If you want use Design 4/5 (Notfification) -> use const script4 or 5
7. In “style_config” you can change the colors of the element and adjust it to your needs
8. Important: script_config: [script1, script2, script3,script4,script5], in this area you must select which elements you use. When you use only script / design one use script_config: [script1], if you use more than one example script 1 and script 2 you can use script_config: [script1, script2],
9. Go to step 3 on this documentation
															

<script>
// How to use:
// 1. Add div(s) to html and give it an id
// 2. add this config script before the script tag
// 3. place the script on the bottom before the closing html tag

// All instances will take up the available space of its div
// If you are using the sidebar option, please specify a fixed height
// To debug, please only use 1 option

const script1 = {
    div_id: "fullscreen", // string // Entry point for the script
    theme_style: 1, // int // Theme: Select 1 for fullscreen, 2 for sidebar, 3 for sidebar single item
    order_by: 2, // int // Sort surveys (optional): Select 1 for best score (default), 2 for best money, 3 for best conversion rate
    limit_surveys: 7 // int // Limit the number of surveys displayed (optional). Default is 12.
};

const script2 = {
    div_id: "sidebar",
    theme_style: 1,
    order_by: 1,
};

const script3 = {
    div_id: "single",
    theme_style: 3,
    display_mode: 1 //(optional): 1 show text "no surveys", 2 make element invisible, 3 dont render the element
    // Display_mode option only affects the behaviour of the box (theme style 3) if no surveys are found
};

// NOTIFICATION LOGIC:
// no text, no link -> earn XX in XX Minutes, survey opening directly
// text and link -> own text + and own link
// text, but no link -> survey is opening directly
// no text, but link -> standard text + link


const script4 = {
    div_id: "notification",
    theme_style: 4,
    position: 5, //number // default 1 // 1 = top center, 2 = top left, 3 top right, 4 bottom left, 5 bottom right, 6 bottom center
    text: "",
    link: "",
    newtab: true
};

const script5 = {
    div_id: "notification2",
    theme_style: 4,
    position: 6, //number // default 1 // 1 = top center, 2 = top left, 3 top right, 4 bottom left, 5 bottom right, 6 bottom center
    text: "",
    link: "https://wall.cpx-research.com/index.php?app_id={your_app_id}&ext_user_id={ext_user_id}",
    newtab: true
};



const config = {
    general_config: {
        app_id: your_app_id, //number
        ext_user_id: "your_user_id", // string
         email: "", // string
         username: "", // string
       secure_hash: "", // string if enabled on publisher area
        subid_1: "", // string
        subid_2: "", // string
    },
    style_config: {
        text_color: "#2b2b2b", // string // hex, rgba, colorcode
        survey_box: {
            topbar_background_color: "#ffaf20", // string // hex, rgba, colorcode
            box_background_color: "white", // string // hex, rgba, colorcode
            rounded_borders: true, // boolean true || false
            stars_filled: "black", // string // hex, rgba, colorcode
        },
    },
    script_config: [script1, script2, script3,script4,script5], // Object Array
    debug: false, // boolean
     useIFrame: true, //boolean    
     iFramePosition: 1, // 1 right (default), 2 left
    functions: {
        no_surveys_available: () =>
        {
            console.log("no surveys available function here");
        }, // Function without parameter, NEVER USE window.alert... because of infinite loop
        count_new_surveys: (countsurveys) =>
        {
            console.log("count surveys function here, count:", countsurveys);
        },
        get_all_surveys: (surveys) =>
        {
            console.log("get all surveys function here, surveys: ", surveys);
        },
        get_transaction: (transactions) =>
        {
            console.log("transaction function here, transaction: ", transactions);
        }
        
        
  }  
  
  
  };

window.config = config;

</script>



                                                        
Step 3
In last step you must say were you want show the element for the user on your page. For this you must add a “div tag” with an id

For the fullscreen Widget:
															

															<div style="max-width: 950px; margin: auto" id="fullscreen"></div>



                                                        
For Single Sidebar Widget:
															

															<div style="width: 100%; height: 150px;" id="single"></div>



                                                        
For Multi Sidebar Widget:
															

															<div id="sidebar" style="height: 469px"></div>



                                                        
For Notification Widget 4/5:
															

															<div id="notification" style="height: 469px"></div>
															<div id="notification2" style="height: 469px"></div>



                                                        
2: Integrate our Frame Integration
The integration of our SurveyWall FRAME is very easy. Just copy the following code and place it on your website. There are several placeholders / free variable parameters which have to be replaced. IMPORTANT: Please fill out your postback URL in the Postback Settings-Tab. Thats important to inform you about the amount of money you earn.

We recommend using our script tag elements. If you want to use the frame integration our publishers can raise their revenues in average 240% by adding our script tag notification box in their footer, so users automatically get informed as soon as a new survey matching their profile is available for them. Click here to see Script
Your Code:
                                                

<iframe width="100%" frameBorder="0" height="2000px"  src="https://offers.cpx-research.com/index.php?app_id=33853&ext_user_id={unique_user_id}&secure_hash={secure_hash}&username={user_name}&email={user_email}&subid_1=&subid_2"></iframe>
                                                

        	                                    
Our Logo: Download
  
Following information needs to be replaced in your code:
Parameter	Type	Description
&ext_user_id={unique_user_id}	Mandatory	Please replace {unique_user_id} with the ID of your user on your site.
This parameter has to be unique per user!
&app_id= 33853	Mandatory	Please add your App ID. Your App ID is: 33853
&secure_hash={secure_hash}	Recommended	For higher security, you can add the secure hash parameter. You can
generate it with your secure hash and the ext_user_id information
(e.g. for php md5 ({unique_user_id}-{app_secure_hash}));
&username=	Recommended	With the parameter username you can send us the username of your user.
&email=	Recommended	We use the e-mail to match duplicate users in our system. In case
you don’t submit the e-mail, we will ask the user for it before he can start.
&subid_1=		You can add some more information when you need it
&subid_2=		You can add some more information when you need it
Example PHP :
                                                

<iframe width="100%" frameBorder="0" height="2000px"  src="https://offers.cpx-research.com/index.php?app_id=33853&ext_user_id=<?php echo $user_id;?>&secure_hash=<?php echo md5($user_id.'-2ivWa3iC6njX5H9mz1T93OKGnF20jhHs);?>&username=<?php echo $user_name;?>&email=<?php echo $email;?>&subid_1=&subid_2"></iframe>
                                                

                                            

                                            3: 
                                        CPX Research - API Documentation
With our API you can display a list of all available surveys for one of your users. The API's output is in JSON format

Version :	v1.1
Last Update :	10-06-2020
Important information
To get a list off all surveys, please call the following URL:

															

https://live-api.cpx-research.com/api/get-surveys.php?app_id={your_app_id}&ext_user_id={ext_user_id}&subid_1={your_subid_1}&subid_2={your_subid_1}&output_method=api&ip_user={ip_user}&user_agent={user_agent}&limit=12&secure_hash={secure_hash}


                                                        
To share User profiling inforamtion you can add the follow params:

&main_info=true&birthday_day=XX&birthday_month=XX&birthday_year=XXXX&gender=X&user_country_code=XX&zip_code=XXXXX
&birthday_day=XX // Day of birth - 1 to 31
&birthday_month=XX // Month of birth - 1 to 12
&birthday_year=XXXX // Year of birth (4 digits)
&gender=m for male // &gender=f for female
&user_country_code=XX (two letter country code)
&zip_code=XXXXX (different length in each country)

As response you'll get a JSON file in the following format:

															

															{"status":"success","count_available_surveys":336,"count_returned_surveys":2,"surveys":[{"id":"484727","loi":"6","payout":0.4,"conversion_rate":"89.00","score":"14.9817","statistics_rating_count":"0","statistics_rating_avg":"0","type":"need_qualification","top":0,"details":0,"payout_publisher_usd":"0.81","href":"https:\/\/click.cpx-research.com\/?k=OWkzZTF6eFlqWDgxRXE1M0ZmRkZseG95bkN4blpEOW9DTUx5MllNN1NxRTVmeHVONEhQWk55NFE4dU14c0lrUUZDNzBWRFEzMUIvN3U0WnAvY2MvL2ExOTlZMHJ3Q1hwT3owTHdTRjUxeU09&subid_1=&subid_2="},{"id":"526856","loi":"9","payout":0.43,"conversion_rate":"100.00","score":"12.0000","statistics_rating_count":"0","statistics_rating_avg":"0","type":"need_qualification","top":0,"details":0,"payout_publisher_usd":"0.86","href":"https:\/\/click.cpx-research.com\/?k=OWkzZTF6eFlqWDgxRXE1M0ZmRkZseG95bkN4blpEOW9DTUx5MllNN1NxRTVmeHVONEhQWk55NFE4dU14c0lrUUZDNzBWRFEzMUIvN3U0WnAvY2MvL2R5eDZ4dzZ5VWFXa0JOSVhLMjRzekk9&subid_1=&subid_2="}]}>

                                                        
Key	Value	Description
id	12345	Our survey ID
payout	0.50	Payout to your user in your local currency (based on your currency settings in publisher profile)
conversion_rate	57.00	Current conversion rate in our system for this project
score	8.1429	Our internal scoring for the survey project: the higher the value, the better the project
statistics_rating_count	0	The number of user ratings the survey got already
statistics_rating_avg	0	User rating value (average) from 1 to 5 stars, 5 = best
type	[i]	“[i]“, means the user will be asked additional profiling / qualifications before the survey can start
top	0	Top surveys have a very good conversion on our platform. Survey is top, when the top status = 1.
details	0	Can be ignored
payout_publisher_usd	0.81	Survey payout to Publisher in USD
href_new	link	Please always use the new design for the entry link, as its mobile optimized and offers the user a search function
Call "Get Surveys"
Please read the following information:

1. Our API is a user based API - please share generated href information only with the user from ext_user_id!
2. Please refresh survey list all 120 seconds and cache information not longer than 120 seconds
Example Script (PHP)
															


<?php
						$your_app_id = 10;  // find on publisher.cpx-research.com
						$your_ext_user_id = '';  // put here the userID or Username from your Users
						$email = '';

						$your_secure_hash = '';  // find on publisher.cpx-research.com

						$limit = 12;
						$subid_1 = '';
						$subid_2 = '';
						$ip_user = $_SERVER["REMOTE_ADDR"]; // example: 5.146.176.100
						$user_agent = rawurlencode($_SERVER['HTTP_USER_AGENT']);  
						$secure_hash_md5 = md5($your_ext_user_id.'-'.$your_secure_hash);

						
						$url_details = "https://live-api.cpx-research.com/api/get-surveys.php?app_id=".$your_app_id."&email=".$email."&ext_user_id=".$your_ext_user_id."&subid_1=".$subid_1."&subid_2=".$subid_2."&output_method=api&ip_user=".$ip_user."&user_agent=".$user_agent."&limit=".$limit."&secure_hash=".$secure_hash_md5."";
						
						echo "ExampleSurveys for call:<br><br><textarea>".$url_details."</textarea>";
						
						$ch =  curl_init($url_details);
						//curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
					    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
					    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
					    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
					    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
						
						$response= curl_exec($ch);
						
						$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
						$result_details = json_decode($response);
						
						if($result_details->status == 'success') {
							if($result_details->count_returned_surveys !== 0) {
								echo '<h1 align="center">We found '.$limit.' Surveys for your Profile</h1>';
								
								echo '<table style="width:100%" border="1">
								  <tr>
								    <th>Id</th>
								    <th>Payout</th>
								    <th>Payout Local Currency</th>
								    <th>Length</th>
								    <th>Conversation</th>
								    <th>Link</th>
								  </tr>
								  ';
								foreach($result_details->surveys as $survey) {
									echo '<tr>
										     <td>'.$survey->id.'</td>
										     <td>'.$survey->payout_publisher_usd.' USD</td>
										     <td>'.$survey->payout.'</td>
										     <td>'.$survey->loi.'</td>
										     <td>'.$survey->conversion_rate.'</td>
										     <td><a href="'.$survey->href.'">Start Survey</td>
										   </tr>
										';
								
								}
								echo '</table>';
								
							} else {
								echo "At this moment no surveys available for your profile";
							}
						} else {
							echo "Surveys could not be loaded!";
						}
						
						
						if($httpcode === 200) {
							
						} else {
							echo "Surveys could not be loaded!";
						}
										
			?>	



                                                        