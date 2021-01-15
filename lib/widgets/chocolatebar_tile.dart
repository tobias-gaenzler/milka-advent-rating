import 'package:flutter/material.dart';
import 'package:milka_advent_calendar_rating/model/chocolatebar.dart';

import 'chocolate_bar_rating_page.dart';

class ChocolateBarTile extends StatelessWidget {
  final String averageRating;
  final ChocolateBar chocolateBar;

  const ChocolateBarTile({
    Key key,
    @required this.chocolateBar,
    this.averageRating,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 5.0, vertical: 3.0),
      color: Color.fromRGBO(64, 75, 96, .9),
      child: ListTile(
          contentPadding: EdgeInsets.symmetric(horizontal: 5.0, vertical: 2.0),
          title: Text(
            chocolateBar.id + ' - ' + chocolateBar.name,
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          leading: _buildCircleImage(chocolateBar),
          trailing: averageRating == null || averageRating.isEmpty
              ? null
              : SizedBox(
                  width: 60.0,
                  child: Row(
                    children: [
                      Icon(
                        Icons.functions,
                        color: Colors.white38,
                      ),
                      Text(averageRating,
                          style: TextStyle(
                            color: Colors.white38,
                            fontWeight: FontWeight.bold,
                          )),
                    ],
                  ),
                ),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ChocolateBarRatingPage(
                  chocolateBar: chocolateBar,
                ),
              ),
            );
          }),
    );
  }

  Widget _buildCircleImage(ChocolateBar displayedChocolateBar) {
    return Hero(
      tag: displayedChocolateBar.hashCode,
      child: FractionallySizedBox(
        widthFactor: 0.25,
        child: displayedChocolateBar.image,
      ),
    );
  }
}
