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



                                                        