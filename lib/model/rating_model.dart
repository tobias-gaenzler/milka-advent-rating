import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:milka_advent_calendar_rating/model/chocolatebar_provider.dart';
import 'package:milka_advent_calendar_rating/model/rating.dart';

import 'chocolatebar.dart';

class RatingModel extends ChangeNotifier {
  final NumberFormat decimalFormat = new NumberFormat("#,##0.0", "de_DE");

  final ChocolateBarProvider _chocolateBarProvider = ChocolateBarProvider();

  List<ChocolateBar> _chocolateBars;
  List<Rating> _ratings = [];
  bool _isLoading = true;

  bool get isLoading => _isLoading;
  List<ChocolateBar> get chocolateBars => _chocolateBars;
  List<Rating> get ratings => _ratings;

  Future loadChocolateBars() async {
    print('loading chocolate bars ...');
    WidgetsFlutterBinding.ensureInitialized();
    _isLoading = true;
    notifyListeners();

    _chocolateBars = await _chocolateBarProvider.getChocolateBars();
    await getRatings();
    _isLoading = false;
    notifyListeners();
  }

  Future getRatings() async {
    print("fetching chocolatebar ratings ...");
    final response = await http
        .get("https://x3887pn6aj.execute-api.eu-central-1.amazonaws.com/list");
    if (response.statusCode == 200) {
      ratings.clear();
      print("received ratings");

      jsonDecode(response.body)['ratingList'].forEach((rating) {
        ratings.add(Rating.fromMap(rating));
      });
    } else {
      // If the server did not return a 200 OK response, then throw an exception.
      print("Exception: failed to load rating" + response.body);
    }
    notifyListeners();
  }

  String getAverageRating(ChocolateBar chocolateBar) {
    if (ratings.isEmpty) {
      return "";
    }
    // find all ratings for chocolate bar
    List<Rating> ratingsForChocolateBar = ratings
        .where((rating) => chocolateBar.id == rating.chocolateBar)
        .toList();
    if (ratingsForChocolateBar.isEmpty) {
      return "";
    }
    double average = ratingsForChocolateBar
            .map((rating) => rating.value)
            .reduce((a, b) => a + b) /
        ratingsForChocolateBar.length;
    return decimalFormat.format(average);
  }
}
