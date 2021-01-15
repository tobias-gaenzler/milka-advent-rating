import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'milka_advent_calendar_rating_app.dart';
import 'model/rating_model.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) {
        var ratingModel = RatingModel();
        ratingModel.loadChocolateBars();
        return ratingModel;
      },
      child: MilkaAdventRatingApp(),
    ),
  );
}
