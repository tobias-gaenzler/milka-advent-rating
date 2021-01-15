import 'package:flutter/material.dart';
import 'package:milka_advent_calendar_rating/model/chocolatebar.dart';

import 'chocolatebar_rating_page_content.dart';

class ChocolateBarRatingPage extends StatelessWidget {
  final ChocolateBar chocolateBar;

  ChocolateBarRatingPage({
    Key key,
    @required this.chocolateBar,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(chocolateBar.name),
      ),
      body: ChocolateBarRatingPageContent(
        chocolateBar: chocolateBar,
      ),
    );
  }
}
