import 'package:flutter/material.dart';
import 'package:milka_advent_calendar_rating/model/rating_model.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:milka_advent_calendar_rating/model/chocolatebar.dart';

import 'chocolatebar_tile.dart';

class MilkaAdventRatingHome extends StatefulWidget {
  static const USER_NAME_KEY = 'user_name';

  @override
  _MilkaAdventRatingHomeState createState() =>
      new _MilkaAdventRatingHomeState();
}

class _MilkaAdventRatingHomeState extends State<MilkaAdventRatingHome> {
  final _nameFieldController = TextEditingController();
  SharedPreferences _sharedPreferences;
  String _userName;

  @override
  void initState() {
    super.initState(); // first call in initState
    SharedPreferences.getInstance().then((prefs) => {
          setState(() => {
                _sharedPreferences = prefs,
                _userName = _sharedPreferences
                    .getString(MilkaAdventRatingHome.USER_NAME_KEY),
              })
        });
  }

  @override
  void dispose() {
    _nameFieldController.dispose();
    super.dispose(); // last call in dispose
  }

  @override
  Widget build(BuildContext context) {
    Future.delayed(Duration.zero, () => _askForNameIfNotSet(context));
    return Scaffold(
      appBar: AppBar(
        title: _userName == null
            ? Text('Milka Rating')
            : Text("$_userName\'s Milka Rating"),
        actions: <Widget>[
          IconButton(
            icon: Icon(
              Icons.replay,
              color: Colors.white38,
            ),
            onPressed: () {
              Provider.of<RatingModel>(context, listen: false).getRatings();
            },
          )
        ],
      ),
      body: Consumer<RatingModel>(builder: (context, ratingModel, child) {
        if (ratingModel.isLoading) {
          return Padding(
            padding: EdgeInsets.all(10),
            child: Center(
              child: CircularProgressIndicator(),
            ),
          );
        } else {
          return Column(
            children: [
              _buildChocolateBarList(ratingModel.chocolateBars),
            ],
          );
        }
      }),
    );
  }

  void _askForNameIfNotSet(BuildContext context) async {
    if (_sharedPreferences != null &&
        _sharedPreferences.getString(MilkaAdventRatingHome.USER_NAME_KEY) ==
            null) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: new Text("Please enter your name"),
            content: TextField(
              controller: _nameFieldController,
              onSubmitted: (name) => _onUserNameSubmitted(context, name),
            ),
          );
        },
      );
    }
  }

  void _onUserNameSubmitted(BuildContext context, String userName) {
    Navigator.of(context).pop();
    _sharedPreferences.setString(MilkaAdventRatingHome.USER_NAME_KEY, userName);
    setState(() {
      this._userName = userName;
    });
  }

  Widget _buildChocolateBarList(List<ChocolateBar> chocolateBars) {
    RatingModel ratingModel = Provider.of<RatingModel>(context, listen: false);
    return Expanded(
      child: ListView.builder(
        itemCount: chocolateBars.length,
        itemBuilder: (context, index) {
          return ChocolateBarTile(
            chocolateBar: chocolateBars[index],
            averageRating: ratingModel.getAverageRating(chocolateBars[index]),
          );
        },
      ),
    );
  }
}
