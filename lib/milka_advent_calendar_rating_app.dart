import 'package:flutter/material.dart';
import 'package:milka_advent_calendar_rating/widgets/milka_advent_rating_home.dart';

class MilkaAdventRatingApp extends StatelessWidget {
  // required since milka purple is no material color
  static const Map<int, Color> milkaPurpleCodes = {
    50: Color.fromRGBO(104, 79, 163, .1),
    100: Color.fromRGBO(104, 79, 163, .2),
    200: Color.fromRGBO(104, 79, 163, .3),
    300: Color.fromRGBO(104, 79, 163, .4),
    400: Color.fromRGBO(104, 79, 163, .5),
    500: Color.fromRGBO(104, 79, 163, .6),
    600: Color.fromRGBO(104, 79, 163, .7),
    700: Color.fromRGBO(104, 79, 163, .8),
    800: Color.fromRGBO(104, 79, 163, .9),
    900: Color.fromRGBO(104, 79, 163, 1.0),
  };
  static const MaterialColor milkaPurple =
      MaterialColor(0xFF684fa3, milkaPurpleCodes);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Milka Rating',
      theme: ThemeData(
        primarySwatch: milkaPurple,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: MilkaAdventRatingHome(),
    );
  }
}
