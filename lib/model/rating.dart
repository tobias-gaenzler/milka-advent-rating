import 'package:flutter/material.dart';

class Rating {
  Rating({
    @required this.chocolateBar,
    @required this.userName,
    @required this.value,
  });

  final String chocolateBar;
  final String userName;
  double value;

  Map<String, dynamic> toMap() {
    return {
      'ChocolateBar': chocolateBar,
      'UserName': userName,
      'Value': value,
    };
  }

  static Rating fromMap(Map<String, dynamic> map) {
    return Rating(
      chocolateBar: map['ChocolateBar'],
      userName: map['UserName'],
      value: map['Value'].toDouble(),
    );
  }
}
