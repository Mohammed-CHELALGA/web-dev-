$(document).ready(function () {

    // Add a new course row
    $('#addCourse').click(function () {
        var row = $('.course-row').first().clone();
        row.find('input').val('');

        row.append(
            '<div class="col-auto">' +
            '<button type="button" class="btn btn-danger remove-row" data-toggle="tooltip" data-placement="right" title="Click to remove this row">X</button>' +
            '</div>'
        );

        $('#courses').append(row);
        $('[data-toggle="tooltip"]').tooltip();
    });

    // Remove a course row
    $(document).on('click', '.remove-row', function () {
        if ($('.course-row').length > 1) {
            $(this).closest('.course-row').remove();
        }
    });

    // Submit via AJAX
    $('#gpaForm').submit(function (e) {
        e.preventDefault();

        // Client-side validation
        var valid = true;
        var msg = '';
        var valid_course = /^[a-zA-Z0-9 ]+$/;

        $('[name="course[]"]').each(function () {
            if ($(this).val().trim() === '' || !valid_course.test($(this).val().trim())) {
                valid = false;
                msg = ' A course name cannot be empty and must contain only letters and numbers.';
                return false;
            }
        });

        $('[name="credits[]"]').each(function () {
            if (isNaN($(this).val()) || !Number.isInteger(Number($(this).val()))|| parseFloat($(this).val()) <= 0 || parseFloat($(this).val()) > 6) {
                valid = false;
                msg = ' All credits must be valid integers between 1 and 6 inclusive.';
                return false;
            }
        });

        if (!valid) {
            $('#result').html(
                '<div class="alert alert-warning">' +
                'Please enter valid values in all fields.' + msg +
                '</div>'
            );
            return;
        }

        $.ajax({
            url: 'calculate.php',
            type: 'POST',
            data: $(this).serialize(),
            dataType: 'json',

            success: function (response) {

                if (response.success) {

                    var alertClass = 'alert-info';
                    var prog_bg = 'bg-info';

                    if (response.gpa >= 3.7) {
                        alertClass = 'alert-success';
                        prog_bg = 'bg-success';
                    } 
                    else if (response.gpa >= 3.0) {
                        alertClass = 'alert-info';
                        prog_bg = 'bg-info';
                    } 
                    else if (response.gpa >= 2.0) {
                        alertClass = 'alert-warning';
                        prog_bg = 'bg-warning';
                    } 
                    else {
                        alertClass = 'alert-danger';
                        prog_bg = 'bg-danger';
                    }

                    $('#result').html(
                        '<div class="alert ' + alertClass + '">' +
                        response.message +
                        '</div>' +
                        '<button id="export-to-csv" class="btn btn-success mb-3" data-toggle="tooltip" data-placement="right" title="Export the result to CSV">Export CSV</button>' + 
                        '<div class="progress" style="height: 50px;" role="progressbar" aria-label="Example" aria-valuenow="' + response.prog + '" aria-valuemin="0" aria-valuemax="100">' +
                            '<div class="progress-bar ' + prog_bg + '" style="width: ' + response.prog + '%">' + '<strong>' + response.interpretation +  ' </strong> </div>' +
                        '</div>'
                        +
                        response.tableHtml
                    );

                } 
                else {

                    $('#result').html(
                        '<div class="alert alert-danger">' +
                        response.message +
                        '</div>'
                    );

                }

            },

            error: function () {
                $('#result').html(
                    '<div class="alert alert-danger">' +
                    'Server error occurred.' +
                    '</div>'
                );
            }

        });


    });
    
    $(document).on('click', '#export-to-csv', function () {
    var gpaText = $('#result .alert').first().text().trim();
    var csv = [];
    var matches = gpaText.match(/Your GPA is ([0-9.]+) \((.+)\)/);
    if (matches) {
        csv.push(['GPA', matches[1], matches[2]].join(','));
        csv.push(''); // empty line before table
    }
    
    $('#result table tr').each(function () {

        var row = [];

        $(this).find('th, td').each(function () {
            row.push($(this).text().trim());
        });

        csv.push(row.join(','));

    });

    var csvString = csv.join('\n');

    var blob = new Blob([csvString], { type: 'text/csv' });

    var url = window.URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'gpa_results.csv';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    });

});