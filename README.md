# Milka advent calendar (rating)

We have an advent calendar consiting of 24 bars of milka chocolate.
Every day one chocolate bar is opened and a rating is provided by every member of the family for this bar via this flutter app.

## Architecture
Flutter app which runs on android/ios:
* retrieves ratings of other family members via rest from aws for already rated chocolate bars
* contains a form to rate chocolate bars and send the results via rest to aws 

