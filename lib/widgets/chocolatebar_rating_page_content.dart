import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:http/http.dart';
import 'package:http/http.dart' as http;
import 'package:milka_advent_calendar_rating/model/chocolatebar.dart';
import 'package:milka_advent_calendar_rating/model/rating_model.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'milka_advent_rating_home.dart';

class ChocolateBarRatingPageContent extends StatefulWidget {
  final ChocolateBar chocolateBar;

  ChocolateBarRatingPageContent({
    Key key,
    this.chocolateBar,
  }) : super(key: key);

  _ChocolateBarRatingPageContentState createState() =>
      _ChocolateBarRatingPageContentState();
}

class _ChocolateBarRatingPageContentState
    extends State<ChocolateBarRatingPageContent> {
  String userName;
  Future<String> _futureRating;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((prefs) => {
          setState(() => {
                userName = prefs.getString(MilkaAdventRatingHome.USER_NAME_KEY),
                _futureRating = _fetchRating(userName, widget.chocolateBar.id)
              })
        });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(0.0),
      decoration: BoxDecoration(color: Colors.white),
      child: ListView(
        padding: EdgeInsets.all(0.0),
        children: <Widget>[
          _buildChocolateBarPicture(),
          FutureBuilder<String>(
            future: _futureRating,
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                return Center(
                  child: RatingBar.builder(
                    initialRating: double.parse(snapshot.data),
                    minRating: 0,
                    itemSize: 34.0,
                    direction: Axis.horizontal,
                    allowHalfRating: false,
                    itemCount: 10,
                    unratedColor: Colors.grey[350],
                    itemPadding: EdgeInsets.all(0.0),
                    itemBuilder: (context, _) => Icon(
                      Icons.favorite,
                      color: Color.fromRGBO(104, 79, 163, 1.0),
                    ),
                    onRatingUpdate: (rating) {
                      print('Submitted rating: $rating');
                      setState(() {
                        _submitRating(rating, widget.chocolateBar.id, userName)
                            .then((response) => {
                                  Provider.of<RatingModel>(context,
                                          listen: false)
                                      .getRatings(),
                                });
                      });
                    },
                  ),
                );
              } else if (snapshot.hasError) {
                return Text("${snapshot.error}");
              }
              // By default, show a loading spinner.
              return Center(child: CircularProgressIndicator());
            },
          ),
        ],
      ),
    );
  }

  Widget _buildChocolateBarPicture() {
    final screenHeight = MediaQuery.of(context).size.height;
    double factor = 0.5;
    if (MediaQuery.of(context).orientation == Orientation.portrait) {
      factor = 0.3;
    }
    return SizedBox(
      height: screenHeight * factor,
      child: Hero(
          tag: widget.chocolateBar?.hashCode ?? 0,
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: InteractiveViewer(
              boundaryMargin: EdgeInsets.all(80),
              child: Image.asset(
                widget.chocolateBar.asset,
                fit: BoxFit.contain,
              ),
            ),
          )),
    );
  }

  Future<String> _fetchRating(String userName, String chocolateBar) async {
    print("Fetching rating for user:$userName and chocolateBar:$chocolateBar");
    final response = await http.get(
        "https://x3887pn6aj.execute-api.eu-central-1.amazonaws.com/milkarating?UserName=$userName&ChocolateBar=$chocolateBar");
    if (response.statusCode == 200 &&
        double.tryParse(jsonDecode(response.body)['Value'].toString()) !=
            null) {
      print("received rating" + response.body);
      // If the server did return a 200 OK response,
      // then parse the JSON.
      return jsonDecode(response.body)['Value'].toString();
    } else {
      // If the server did not return a 200 OK response,
      // then throw an exception.
      print("Exception: failed to load rating" + response.body);
      return "0";
    }
  }

  Future<Response> _submitRating(
      double ratingValue, String chocolateBarId, String userName) {
    var resBody = {};
    resBody["UserName"] = userName;
    resBody["ChocolateBar"] = chocolateBarId;
    resBody["Value"] = ratingValue;
    var rating = {};
    rating["Rating"] = resBody;
    return http.post(
      'https://x3887pn6aj.execute-api.eu-central-1.amazonaws.com/milkarating',
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonEncode(rating),
    );
  }
}
