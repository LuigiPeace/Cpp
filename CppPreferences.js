/*
 * Copyright (c) 2013-2014 Minkyu Lee. All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains the
 * property of Minkyu Lee. The intellectual and technical concepts
 * contained herein are proprietary to Minkyu Lee and may be covered
 * by Republic of Korea and Foreign Patents, patents in process,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Minkyu Lee (niklaus.lee@gmail.com).
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, appshell, app */

define(function (require, exports, module) {
    "use strict";

    var AppInit           = app.getModule("utils/AppInit"),
        Core              = app.getModule("core/Core"),
        PreferenceManager = app.getModule("core/PreferenceManager");

    var preferenceId = "Cpp";

    var CppPreferences = {
        "Cpp.gen": {
            text: "C++ Code Generation",
            type: "Section"
        },
        "Cpp.gen.useTab": {
            text: "Use Tab",
            description: "Use Tab for indentation instead of spaces.",
            type: "Check",
            default: false
        },
        "Cpp.gen.indentSpaces": {
            text: "Indent Spaces",
            description: "Number of spaces for indentation.",
            type: "Number",
            default: 4
        },
        "Cpp.gen.includeHeader": {
            text: "Include default header",
            description: "Include default header.",
            type: "Check",
            default: true
        },
		"Cpp.gen.isCpp11": {
            text: "C++11",
            description: "Enable C++11 features.",
            type: "Check",
            default: false
        },
		"Cpp.gen.headerFormat": {
            text: "Header's file format",
            description: "Use h or hh file format.",
            type: "String",
            default: "hh"
        },
		"Cpp.gen.commentsFormat": {
            text: "Choose the format used for comments",
            description: "Choose the format used for comments: (true) /* * */, (false) //",
            type: "Check",
            default: true
        },
		"Cpp.gen.doxygenTemplate": {
            text: "Add a documentation template compliant with Doxygen",
            description: "Add a documentation template compliant with Doxygen.",
            type: "Check",
            default: true
        },
		"Cpp.gen.stdInclude": {
            text: "Add includes from the std library",
            description: "Add includes from the std library.",
            type: "Check",
            default: true
        },
		"Cpp.gen.stdNamespace": {
            text: "Use special format for namespace",
            description: "Use a special format string to allow namespace. (instead of std:: use std__ for example).",
            type: "String",
            default: "__"
        },
		"Cpp.gen.separator": {
            text: "Use special separator to separate template arguments",
            description: "Use special separator to separate template arguments. (map<foo| bar> become map<foo, bar>)",
            type: "String",
            default: "|"
        },
		"Cpp.gen.attributeName": {
            text: "Add a prefix to attribute's name",
            description: "Add a prefix to attribute's name.",
            type: "String",
            default: "m_"
        },
        "Cpp.gen.useVector": {
            text: "Use vector instead of *",
            description: "Use vector<> instead of pointer.",
            type: "Check",
            default: true
        },
        "Cpp.gen.genCpp": {
            text: "Generate *.cpp file",
            description: "Generate cpp file",
            type: "Check",
            default: true
        },
        "Cpp.rev": {
            text: "C++ Reverse Engineering",
            type: "Section"
        },
        "Cpp.rev.association": {
            text: "Use Association",
            description: "Reverse C++ Fields as UML Associations.",
            type: "Check",
            default: true
        },
        "Cpp.rev.publicOnly": {
            text: "Public Only",
            description: "Reverse public members only.",
            type: "Check",
            default: false
        },
        "Cpp.rev.typeHierarchy": {
            text: "Type Hierarchy Diagram",
            description: "Create a type hierarchy diagram for all classes and interfaces",
            type: "Check",
            default: true
        },
        "Cpp.rev.packageOverview": {
            text: "Package Overview Diagram",
            description: "Create overview diagram for each package",
            type: "Check",
            default: true
        },
        "Cpp.rev.packageStructure": {
            text: "Package Structure Diagram",
            description: "Create a package structure diagram for all packages",
            type: "Check",
            default: true
        }
    };

    function getId() {
        return preferenceId;
    }

    function getGenOptions() {
        return {
            useTab              : PreferenceManager.get("Cpp.gen.useTab"),
            indentSpaces        : PreferenceManager.get("Cpp.gen.indentSpaces"),
            useVector           : PreferenceManager.get("Cpp.gen.useVector"),
            includeHeader       : PreferenceManager.get("Cpp.gen.includeHeader"),
			isCpp11				: PreferenceManager.get("Cpp.gen.isCpp11"),
			headerFormat        : PreferenceManager.get("Cpp.gen.headerFormat"),
			commentsFormat		: PreferenceManager.get("Cpp.gen.commentsFormat"),
			doxygenTemplate		: PreferenceManager.get("Cpp.gen.doxygenTemplate"),
			stdInclude          : PreferenceManager.get("Cpp.gen.stdInclude"),
			stdNamespace        : PreferenceManager.get("Cpp.gen.stdNamespace"),
			separator	        : PreferenceManager.get("Cpp.gen.separator"),
			attributeName		: PreferenceManager.get("Cpp.gen.attributeName"),
            genCpp              : PreferenceManager.get("Cpp.gen.genCpp")
        };
    }

    function getRevOptions() {
        return {
            association      : PreferenceManager.get("Cpp.rev.association"),
            publicOnly       : PreferenceManager.get("Cpp.rev.publicOnly"),
            typeHierarchy    : PreferenceManager.get("Cpp.rev.typeHierarchy"),
            packageOverview  : PreferenceManager.get("Cpp.rev.packageOverview"),
            packageStructure : PreferenceManager.get("Cpp.rev.packageStructure")
        };
    }

    AppInit.htmlReady(function () {
        PreferenceManager.register(preferenceId, "C++", CppPreferences);
    });

    exports.getId         = getId;
    exports.getGenOptions = getGenOptions;
    exports.getRevOptions = getRevOptions;
});
