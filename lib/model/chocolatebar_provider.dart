import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:milka_advent_calendar_rating/model/chocolatebar.dart';

class ChocolateBarProvider {
  Future<List<ChocolateBar>> getChocolateBars() async {
    String data = await rootBundle.loadString('assets/json/chocolatebars.json');
    List<ChocolateBar> _chocolateBars = [];

    jsonDecode(data).forEach((chocolateBar) {
      _chocolateBars.add(ChocolateBar.fromMap(chocolateBar));
    });
    return _chocolateBars;
  }
}
