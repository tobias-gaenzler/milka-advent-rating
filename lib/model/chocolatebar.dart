import 'package:flutter/material.dart';
import 'package:meta/meta.dart';

class ChocolateBar {
  ChocolateBar({
    @required this.id,
    @required this.name,
  });

  final String id;
  final String name;

  static ChocolateBar fromMap(Map<String, dynamic> map) {
    return ChocolateBar(
      id: map['id'],
      name: map['name'],
    );
  }

  String get asset {
    return 'assets/images/$id.jpg';
  }

  Image get image {
    return Image.asset(
      this.asset,
      fit: BoxFit.fitWidth,
    );
  }
}
