# InfoVis Academic Activity Visualizer

This is a simple information visualization tool for academic activity data.

It visualizes researchers as nodes in a collaboration network.
Each node contains mini bar charts that show multiple academic activity attributes, such as publications, reviews, and e-mails.

## Features

* Visualize researchers as network nodes
* Show collaboration relationships as links
* Display normalized mini bar charts inside each node
* Add, edit, and remove researchers
* Edit attribute names and values
* Select collaborations using checkboxes
* Import dataset from a JSON file
* Export the current dataset as a JSON file
* Collapse the dataset editor for a cleaner view

## How to Use

Open index.html in a web browser.

You can edit the dataset from the input panel at the top of the page.

1. Edit attribute names.
2. Add or remove researchers.
3. Enter activity values for each researcher.
4. Select collaboration relationships using checkboxes.
5. Click Update visualization.

The visualization is automatically regenerated based on the edited data.

## JSON Format

You can also import a JSON file using the following format:

{
  "attributes": ["ACM", "TVCG", "IEEE", "Reviews", "Emails"],
  "researchers": [
    {
      "name": "A",
      "values": [80, 30, 100, 500, 300],
      "collaboratesWith": ["B", "C", "D"],
      "description": "highest activity"
    },
    {
      "name": "B",
      "values": [20, 0, 10, 20, 15],
      "collaboratesWith": ["A", "D"],
      "description": "low activity"
    }
  ]
}