var JsonFile;
var LastIndex;
var Filters=[];
var FilteredData=[];



//DOM Load Event
$(function () {
    $.getJSON('data.json', function (data) {
        JsonFile=data;
        createJobCards(JsonFile);
        LastIndex=JsonFile[JsonFile.length-1].id;
    })
    .fail(function (jqxhr, textStatus, error) {
        console.error('Error loading JSON data:', error);
    });
    const $FilterBarItem=$('.filter-bar-item');
    $FilterBarItem.on("resize",AdjustTopMargin);
    $(window).on("resize",AdjustTopMargin);
});


//DOM Elements
const $modal = $('#myModal');
const $openModalBtn = $('#add-button');
const $closeModalBtn = $('.close');
const $descmodal = $('#myModal-desc');
const $jobdesc = $('.job-description');
const $clearfilters=$('.clear-button');
const $FilterBar=$('.filter-bar');
const $NewJobForm=$('#jobSearchForm');
const $JobList=$('#job-listings');

//DOM Event Listeners
$openModalBtn.on("click", openModal);
$closeModalBtn.on("click", closeModal);
$clearfilters.on("click",ClearFilters);
$NewJobForm.on("submit",function(e){
    e.preventDefault();
    LastIndex++;
    function convertAttachmentToDataURL(dataurl) {
        var fileInput = $("#attachment")[0].files[0];
        if (fileInput) {
            var reader = new FileReader();
            reader.onload = function (e) {
                dataurl(e.target.result);
            };
            reader.readAsDataURL(fileInput);
        } else {
            dataurl(null); 
        }
    };
    convertAttachmentToDataURL(function (attachmentDataURL) {
        var formData = {
            "id": LastIndex,
            "company": $("#company").val(),
            "logo": attachmentDataURL,
            "new": true,
            "featured": $("#featured").prop("checked"),
            "position": $("#position").val(),
            "role": $("#role").val(),
            "level": $("#level").val(),
            "postedAt": "Now",
            "contract": $("#contract").val(),
            "location": $("#location").val(),
            "languages": $("input[name='languages[]']:checked").map(function () {return $(this).val();}).get(),
            "tools": $("input[name='tools[]']:checked").map(function () {return $(this).val();}).get()
        };
        JsonFile.unshift(formData);
        JsonFile.sort((a, b) => {
            if (a.featured === b.featured) {
                if (a.new === b.new) {
                    return 0;
                } else if (a.new) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (b.featured) {
                return 1;
            } else {
                return -1;
            }
        });
        $NewJobForm[0].reset();
        if(Filters.length==0){
            createJobCards(JsonFile);
        }
        else{
            FilterData();
        }
        closeModal();
    });
});
$(window).on("click",function (e) {
    if (e.target === $modal[0] || e.target === $descmodal[0]) {
        $NewJobForm[0].reset();
        closeModal();
        $('body').css('overflow', 'auto');
    }
});
$("#company, #position, #attachment").on("change", function () {
    checkRequiredFields();
});

//DOM Manipulation Functions
function openModal() {
    checkRequiredFields();
    $modal.css('display', 'block');
    $('body').css('overflow', 'hidden');
}

function generateDescription(data) {
  return `We are hiring a ${data.position} at ${data.company}. This is a ${data.level} level ${data.role} role, and it's a ${data.contract} position in ${data.location}. If you are passionate about front-end development, we'd love to have you on our team. Apply now to join our dynamic company!`;
}

function generateExperience(data) {
  const experienceArray = [
    `Work on cutting-edge ${data.role} projects`,
    `Collaborate with a talented team`,
    `Contribute to the success of ${data.company}`,
    `Enjoy a ${data.contract} position ${data.location}`,
    `Join a company with a strong commitment to innovation and excellence`,
    `Make a difference in the world of web development`
  ];
  return experienceArray;
}

function AdjustTopMargin(){
    const $FilterBar=$('.filter-bar-item');
    Height=$FilterBar.outerHeight();
    if(Height>70){
        Height=Height+10;
    }
    else{
        Height=(Height/2)+10;
    }
    $JobList.css('margin-top',Height+'px');
}

function openDescModal(card_id) {
    index_card=JsonFile.findIndex(x => x.id==card_id);
    $('.job-logo').attr('src',JsonFile[index_card].logo);
    $('.job-company').text(JsonFile[index_card].company)
    $('.job-heading').text(JsonFile[index_card].position);
    $('.job-role').text(JsonFile[index_card].role);
    $('.job-level').text(JsonFile[index_card].level);
    $jobdesc.text(generateDescription(JsonFile[index_card]));
    const experience = generateExperience(JsonFile[index_card]);
    const experienceList = $('.more-details');
    experienceList.empty();
    experienceList.append('<h4>What you will do</h4>');
    $.each(experience, function (index, item) {
        experienceList.append('<li>' + item + '</li>');
    });
    $('body').css('overflow', 'hidden');
    $descmodal.css('display', 'block');
}

function checkRequiredFields() {
    var company = $("#company").val();
    var position = $("#position").val();
    var attachment = $("#attachment").val();
    if (company && position && attachment) {
        $("#submitButton").prop("disabled", false);
    } else {
        $("#submitButton").prop("disabled", true);
    }
}

function RemoveCard(card_id) {
    index_card=JsonFile.findIndex(x => x.id==card_id);
    JsonFile.splice(index_card,1);
    if(Filters.length==0){
        createJobCards(JsonFile);
    }
    else{
        FilterData();
    }
}

function closeModal() {
    $NewJobForm[0].reset();
    $modal.css('display', 'none');
    $('body').css('overflow', 'auto');
    $descmodal.css('display', 'none');
}

function ClearFilters() {
    Filters=[];
    FilteredData=[];
    createJobCards(JsonFile);
    createFilter();
    $JobList.css('margin-top','25px');
    $FilterBar.css('display','none');
}

function FilterData() {
    FilteredData=[];
    JsonFile.forEach(function(job) {
    const MatchingTags = Filters.every(function(filter) {
        return (
            job.role === filter ||
            job.level === filter ||
            job.languages.includes(filter) ||
            job.tools.includes(filter)
        );
    });
    if (MatchingTags) {
        FilteredData.push(job);
    }
});
    createJobCards(FilteredData);
    AdjustTopMargin();
}

function AddFilter(filter) {
    if(!Filters.includes(filter)){
        Filters.push(filter);
        createFilter();
        FilterData();
    }
}

function RemoveFilter(filter) {
    Filters.splice(Filters.indexOf(filter),1);
    createFilter();
    if(Filters.length==0){
        $JobList.css('margin-top','25px');
        $FilterBar.css('display','none');
        createJobCards(JsonFile);
    }
    else{
        FilterData();
    }   
}


function createFilter() {
    var filterList = $('.items');
    filterList.empty();
    $FilterBar.css('display','flex');
    $.each(Filters, function (index, filter) {
        var filterTag = $('<div class="filter-tag"></div>');
        filterTag.append('<p>'+filter+'</p>');
        filterTag.append('<button class="remove-button"><i class="fa-solid fa-times"></i></button>');
        filterTag.on("click",function(e){
            if($(e.target).hasClass('fa-times') || $(e.target).hasClass('remove-button')){
                RemoveFilter(filter);
            }
        });
        filterList.append(filterTag);
    });
}

function createJobCards(Data) {
  if (Data) {
    var jobList = $('#job-listings');
    jobList.empty();
    $.each(Data, function (index, job) {
        var Card=$('<div class="card" id="'+index+'"></div>');
        var jobCard = $('<div class="job-card" id="'+index+'"></div>');
        Card.hide();
        if (job.logo) {
            var imageCard = $('<div class="Image-Card"></div>');
            var img = $('<img src="' + job.logo + '" alt="' + job.company + '">');
            imageCard.append(img);
            jobCard.append(imageCard);
        }

        var jobDetails = $('<div class="job-details"></div>');
        var jobDetailsTop = $('<div class="job-details-top"></div>');
        jobDetailsTop.append('<h3>' + job.company + '</h3>');
        if (job.new) {
            var newLabel = $('<div class="new">New!</div>');
            jobDetailsTop.append(newLabel);
        }
        if (job.featured) {
            Card.css('border-left','4.5px solid hsl(180, 33%, 35%)');
            var featuredLabel = $('<div class="featured">Featured</div>');
            jobDetailsTop.append(featuredLabel);
        }
        else{
            Card.css('border-left','border-left: 4.5px solid hsl(180, 31%, 95%);');
        }

        var jobDetailsMiddle = $('<div class="job-details-middle"></div>');
        jobDetailsMiddle.append('<div class="job-details-name">' + job.position + '</div>');

        var jobDetailsBottom = $('<div class="job-details-bottom"></div>');
        jobDetailsBottom.append('<div class="job-details-bottom-item">' + job.postedAt + '</div>');
        jobDetailsBottom.append('<div class="circle"></div>');
        jobDetailsBottom.append('<div class="job-details-bottom-item">' + job.contract + '</div>');
        jobDetailsBottom.append('<div class="circle"></div>');
        jobDetailsBottom.append('<div class="job-details-bottom-item">' + job.location + '</div>');

        jobDetails.append(jobDetailsTop, jobDetailsMiddle, jobDetailsBottom);

        var jobTags = $('<div class="job-details-tags"></div>');
        if (job.role) {
            jobTags.append('<button class="job-details-tag">' + job.role + '</button>');
        }
        if (job.level) {
            jobTags.append('<button class="job-details-tag">' + job.level + '</button>');

        }
        if (job.languages) {
            $.each(job.languages, function (i, language) {
                jobTags.append('<button class="job-details-tag">' + language + '</button>');
            });
        }
        if (job.tools) {
            $.each(job.tools, function (i, tool) {
                jobTags.append('<button class="job-details-tag">' + tool + '</button>');
            });
        }
        jobTags.on("click",function(e){
                if($(e.target).hasClass('job-details-tag')){
                    AddFilter($(e.target).text());
                }
        });
        Card.on("click",function(e){
            if (!$(e.target).hasClass('delete') && !$(e.target).hasClass('fa-trash-can') && !$(e.target).hasClass('job-details-tag')) {
                openDescModal(job.id);
            }
        });

        var deletebtn=$('<div class="delete-btn"><button class="delete" value="'+job.id+'"><i class="fa-solid fa-trash-can"></i></button></div>');
        deletebtn.on("click",function(e){
            if($(e.target).hasClass('fa-trash-can') || $(e.target).hasClass('delete')){
                RemoveCard(job.id);
            }
        });
        Card.delay(index * 250).fadeIn(400);
        jobCard.append(jobDetails, '<div class="vertical-line"></div>', jobTags);
        Card.append(jobCard);
        Card.append(deletebtn);
        jobList.append(Card);
    });
  }
  else{
    console.log("No Data");
  }
}