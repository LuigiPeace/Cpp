/*
 * Copyright (c) 2014 MKLab. All rights reserved.
 * Copyright (c) 2014 Sebastian Schleemilch.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, $, _, window, app, type, document, cpp */

define(function (require, exports, module) {
    "use strict";

    var _CPP_CODE_GEN_H = "h";
    var _CPP_CODE_GEN_CPP = "cpp";

    var _CPP_PUBLIC_MOD = "public";
    var _CPP_PROTECTED_MOD = "protected";
    var _CPP_PRIVATE_MOD = "private";

    var Repository     = app.getModule("core/Repository"),
        ProjectManager = app.getModule("engine/ProjectManager"),
        Engine         = app.getModule("engine/Engine"),
        FileSystem     = app.getModule("filesystem/FileSystem"),
        FileUtils      = app.getModule("file/FileUtils"),
        Async          = app.getModule("utils/Async"),
        UML            = app.getModule("uml/UML");

    var CodeGenUtils = require("CodeGenUtils");

    var copyrightHeader = "/* Test header @ toori67 \n * This is Test\n * also test\n * also test again\n */";
    var versionString = "v0.0.1";
	
	var stdCIncludes = ["cstdlib", "ctime"],
		stdCppIncludes = ["stack", "queue", "vector", "list", "map", "string", "sstream", "fstream", "iostream"];
	
	var stdCType = {
			'cstdlib': ["size_t"],
			'ctime': ["time_t"]
		},
		stdCppType = {
			'stack': ["stack"],
			'queue': ["queue"],
			'vector': ["vector"],
			'list': ["list"],
			'map': ["map"],
			'string': ["string"],
			'sstream': ["stringstream", "ostringstream", "istringstream"],
			'fstream': ["fstream", "ifstream", "ofstream"],
			'iostream': ["string"]
		};
	
	function Comments(fmt) {
		this.start = ((!fmt) ? "/*" : "//");
		this.middle = ((!fmt) ? " *" : "//");
		this.end = ((!fmt) ? " */" : "//");
	};
	
	var comments = new Comments(false);
	
	
    /**
     * Cpp code generator
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     *
     */
    function CppCodeGenerator(baseModel, basePath) {

        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {string} */
        this.basePath = basePath;

        var doc = "";
        if (ProjectManager.getProject().name && ProjectManager.getProject().name.length > 0) {
            doc += "\nProject " + ProjectManager.getProject().name;
        }
        if (ProjectManager.getProject().author && ProjectManager.getProject().author.length > 0) {
            doc += "\n@author " + ProjectManager.getProject().author;
        }
        if (ProjectManager.getProject().version && ProjectManager.getProject().version.length > 0) {
            doc += "\n@version " + ProjectManager.getProject().version;
        }
        copyrightHeader = this.getDocuments(doc);
		
		this.comments = new Comments(false);
    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    CppCodeGenerator.prototype.getIndentString = function (options) {
        if (options.useTab) {
            return '\t';
        } else {
            var i, len, indent = [];
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(" ");
            }
            return indent.join("");
        }
    };
	
	/**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    CppCodeGenerator.prototype.getDoxygenTemplate = function (hasReturn, parametersName) {
        var template = "";
		var i;
		
		template += this.comments.start + "\n";
		template += this.comments.middle + " \\brief " + "\n";
		
		for (i = 0; i < parametersName.length; i++) {
			template += this.comments.middle + " \\param " + parametersName[i] + " " + "\n";
		}
		
		if (hasReturn) {
			template += this.comments.middle + " \\return " + "\n";
		}
		
		return template + this.comments.end + "\n";
    };
	
    CppCodeGenerator.prototype.generate = function (elem, path, options) {

		this.genOptions = options;
		this.comments = new Comments(this.genOptions.commentsFormat);

        var getFilePath = function (extenstions) {
            var abs_path = path + "/" + elem.name + ".";
            if (extenstions === _CPP_CODE_GEN_H) {
                abs_path += options.headerFormat; //_CPP_CODE_GEN_H;
            } else {
                abs_path += _CPP_CODE_GEN_CPP;
            }
            return abs_path;
        };

        var writeEnumeration = function (codeWriter, elem, cppCodeGen) {
            var modifierList = cppCodeGen.getModifiers(elem);
            var modifierStr = "";
			var i;
			
            for (i = 0; i < modifierList.length; i++) {
                modifierStr += modifierList[i] + " ";
            }
			
            codeWriter.writeLine(modifierStr + "typedef enum\t\te_" + elem.name + "\n{\n\t"  + _.pluck(elem.literals, 'name').join(", ")  + "\n}\t\t\t\t\t" + elem.name + ";");
        };
		
		var getConstructor = function(elem, isCppBody) {
			var methodStr = "";
			
			if (!(elem instanceof type.UMLClass) || (elem instanceof type.UMLInterface)) {
				return "";
			}
			
			if (isCppBody) {
				methodStr += elem.name + "::" + elem.name + "()\n";
				methodStr += "{\n}\n";
			} else {
				methodStr = elem.name + "();";
			}
			
			return methodStr;
		};
		
		var getDestructor = function(elem, isCppBody) {
			var methodStr = "";
			
			if (!elem instanceof type.UMLClass) {
				return "";
			}
			
			if (isCppBody) {
				if (elem instanceof type.UMLInterface) {
					return methodStr;
				}
				
				methodStr += elem.name + "::~" + elem.name + "()\n";
				return methodStr + "{\n}\n";
			}
			
			
			if (elem instanceof type.UMLInterface || elem instanceof type.UMLAbstraction) {
				methodStr += "virtual ";
			}
			
			methodStr += "~" + elem.name + "()";
			
			if (elem instanceof type.UMLInterface) {
				methodStr += " {}";
			}
			
			methodStr += ";";
			
			return methodStr;
		};

        var writeClassHeader = function (codeWriter, elem, cppCodeGen) {
            var i;
            var write = function (items) {
                var i;
                for (i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item instanceof type.UMLAttribute ||  item instanceof type.UMLAssociationEnd) { // if write member variable
                        codeWriter.writeLine(cppCodeGen.getMemberVariable(item));
                    } else if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, false));
                    } else if (item instanceof type.UMLClass) {
                        writeClassHeader(codeWriter, item, cppCodeGen);
                    } else if (item instanceof type.UMLEnumeration) {
                        writeEnumeration(codeWriter, item, cppCodeGen);
                    }
                }
            };
            var writeInheritance = function (elem) {
				var genList = cppCodeGen.getSuperClasses(elem);
                var inheritString = " : ";
                
                if (genList.length === 0) {
                    return "";
                }

				var term = [];
                var i;
                
                for (i = 0; i < genList.length; i++) {
                    var generalization = genList[i];
                    // public AAA, private BBB
                    term.push(generalization.visibility + " " + generalization.target.name);
                }
				
                inheritString += term.join(", ");
                return inheritString;
            };

            // member variable
            var memberAttr = elem.attributes.slice(0);
            var associations = Repository.getRelationshipsOf(elem, function (rel) {
                return (rel instanceof type.UMLAssociation);
            });
            for (i = 0; i < associations.length; i++) {
                var asso = associations[i];
                if (asso.end1.reference === elem && asso.end2.navigable === true && asso.end2.name.length !== 0) {
                    memberAttr.push(asso.end2);
                } else if (asso.end2.reference === elem && asso.end1.navigable === true && asso.end1.name.length !== 0) {
                    memberAttr.push(asso.end1);
                }
            }

            // method
            var methodList = elem.operations.slice(0);
            var innerElement = [];
            for (i = 0; i < elem.ownedElements.length; i++) {
                var element = elem.ownedElements[i];
                if (element instanceof type.UMLClass || element instanceof type.UMLEnumeration) {
                    innerElement.push(element);
                }
            }

            var allMembers = memberAttr.concat(methodList).concat(innerElement);
			var classfiedAttributes = cppCodeGen.classifyVisibility(allMembers);

			var finalModifier = "";
            if (elem.isFinalSpecialization === true || elem.isLeaf === true) {
                finalModifier = " const ";
            }
            var templatePart = cppCodeGen.getTemplateParameter(elem);
            if (templatePart.length > 0) {
                codeWriter.writeLine(templatePart);
            }

            codeWriter.writeLine("class\t\t\t\t" + elem.name + finalModifier + writeInheritance(elem) + "\n{");
            if (classfiedAttributes._public.length > 0) {
                codeWriter.writeLine("public:");
                codeWriter.indent();
				codeWriter.writeLine(getConstructor(elem, false));
				codeWriter.writeLine(getDestructor(elem, false));
				codeWriter.writeLine();
                write(classfiedAttributes._public);
                codeWriter.outdent();
            } else {
				codeWriter.writeLine("public:");
                codeWriter.indent();
				codeWriter.writeLine(getConstructor(elem, false));
				codeWriter.writeLine(getDestructor(elem, false));
				codeWriter.writeLine();
                codeWriter.outdent();
			}
            if (classfiedAttributes._protected.length > 0) {
                codeWriter.writeLine("protected:");
                codeWriter.indent();
                write(classfiedAttributes._protected);
                codeWriter.outdent();
            }
            if (classfiedAttributes._private.length > 0) {
                codeWriter.writeLine("private:");
                codeWriter.indent();
                write(classfiedAttributes._private);
                codeWriter.outdent();
            }

            codeWriter.writeLine("};");
        };

        var writeClassBody = function (codeWriter, elem, cppCodeGen) {
            var i = 0;
            var item;
            var writeClassMethod = function (elemList) {
				
				codeWriter.writeLine(getConstructor(elem, true));
				codeWriter.writeLine(getDestructor(elem, true));

                for (i = 0; i < elemList._public.length; i++) {
                    item = elemList._public[i];
					
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }

                for (i = 0; i < elemList._protected.length; i++) {
                    item = elemList._protected[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }

                for (i = 0; i < elemList._private.length; i++) {
                    item = elemList._private[i];
                    if (item instanceof type.UMLOperation) { // if write method
                        codeWriter.writeLine(cppCodeGen.getMethod(item, true));
                    } else if (item instanceof type.UMLClass) {
                        writeClassBody(codeWriter, item, cppCodeGen);
                    }
                }
            };

            // parsing class
            var methodList = cppCodeGen.classifyVisibility(elem.operations.slice(0));
            var docs = elem.name + " implementation\n\n";
            if(_.isString(elem.documentation)) {
                docs += elem.documentation;
            }
			
			/*codeWriter.writeLine(cppCodeGen.getDocuments(docs));*/
			
            writeClassMethod(methodList);

            // parsing nested class
            var innerClass = [];
            for (i = 0; i < elem.ownedElements.length; i++) {
                var element = elem.ownedElements[i];
                if (element instanceof type.UMLClass) {
                    innerClass.push(element);
                }
            }
            if (innerClass.length > 0) {
                innerClass = cppCodeGen.classifyVisibility(innerClass);
                writeClassMethod(innerClass);
            }

        };

        var result = new $.Deferred(),
        self = this,
        fullPath,
        directory,
        file;

        // Package -> as namespace or not
        if (elem instanceof type.UMLPackage) {
            fullPath = path + "/" + elem.name;
            directory = FileSystem.getDirectoryForPath(fullPath);
            directory.create(function (err, stat) {
                if (!err || err === "AlreadyExists") {
                    Async.doSequentially(
                        elem.ownedElements,
                        function (child) {
                            return self.generate(child, fullPath, options);
                        },
                        false
                    ).then(result.resolve, result.reject);
                } else {
                    result.reject(err);
                }
            });

        } else if (elem instanceof type.UMLClass) {

            // generate class header elem_name.h
            file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_H));
            FileUtils.writeText(file, this.writeHeaderSkeletonCode(elem, options, writeClassHeader), true).then(result.resolve, result.reject);

            // generate class cpp elem_name.cpp
            if (options.genCpp) {
                file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_CPP));
                FileUtils.writeText(file, this.writeBodySkeletonCode(elem, options, writeClassBody), true).then(result.resolve, result.reject);
            }

        } else if (elem instanceof type.UMLInterface) {
            /**
             * interface will convert to class which only contains virtual method and member variable.
             */
            // generate interface header ONLY elem_name.h
            file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_H));
            FileUtils.writeText(file, this.writeHeaderSkeletonCode(elem, options, writeClassHeader), true).then(result.resolve, result.reject);

        } else if (elem instanceof type.UMLEnumeration) {
            // generate enumeration header ONLY elem_name.h

            file = FileSystem.getFileForPath(getFilePath(_CPP_CODE_GEN_H));
            FileUtils.writeText(file, this.writeHeaderSkeletonCode(elem, options, writeEnumeration), true).then(result.resolve, result.reject);
        } else {
            result.resolve();
        }
        return result.promise();
    };

    /**
     * Write *.hh file. Implement functor to each uml type.
     * Returns text
     *
     * @param {Object} elem
     * @param {Object} options
     * @param {Object} functor
     * @return {Object} string
     */
    CppCodeGenerator.prototype.writeHeaderSkeletonCode = function (elem, options, funct) {
        var headerString = "__" + elem.name.toUpperCase() + "_" + options.headerFormat.toUpperCase() + "__";
        var codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));
        var includePart = this.getIncludePart(elem);
		
		if (this.genOptions.doxygenTemplate) {
			/*codeWriter.writeLine(copyrightHeader);*/
		}
		
        codeWriter.writeLine();
        codeWriter.writeLine("#ifndef\t\t\t\t" + headerString);
        codeWriter.writeLine("# define\t\t\t" + headerString);
        codeWriter.writeLine();

        if (includePart.length > 0) {
            codeWriter.writeLine(includePart);
            codeWriter.writeLine();
        }
        funct(codeWriter, elem, this);

        codeWriter.writeLine();
        codeWriter.writeLine("#endif\t\t\t\t//" + headerString);
        return codeWriter.getData();
    };

    /**
     * Write *.cpp file. Implement functor to each uml type.
     * Returns text
     *
     * @param {Object} elem
     * @param {Object} options
     * @param {Object} functor
     * @return {Object} string
     */
    CppCodeGenerator.prototype.writeBodySkeletonCode = function (elem, options, funct) {
        var codeWriter = new CodeGenUtils.CodeWriter(this.getIndentString(options));

		if (options.doxygenTemplate) {
			/*codeWriter.writeLine(copyrightHeader);*/
		}
		
        codeWriter.writeLine();
        codeWriter.writeLine("#include\t\t\t\"" +  elem.name + "." + options.headerFormat + "\"");
        codeWriter.writeLine();
        funct(codeWriter, elem, this);
        return codeWriter.getData();
    };

    /**
     * Parsing template parameter
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getTemplateParameter = function (elem) {
		var returnTemplateString = "";
		var term = [];
        var i;
        
        if (elem.templateParameters.length <= 0) {
            return returnTemplateString;
        }
        
        returnTemplateString = "template<";

        for (i = 0; i < elem.templateParameters.length; i++) {
            var template = elem.templateParameters[i];
            var templateStr = template.parameterType + " ";
            templateStr += template.name + " ";
            if (template.defaultValue.length !== 0) {
                templateStr += " = " + template.defaultValue;
            }
            term.push(templateStr);
        }
        returnTemplateString += term.join(", ");
        returnTemplateString += ">";
        return returnTemplateString;
    };

    /**
     * Parsing include header
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getIncludePart = function (elem) {

        var i;
        var trackingHeader = function (elem, target) {
            var elementString = "";
            var targetString = "";
			var header = "";
            var i;


            while (elem._parent._parent !== null) {
                elementString = (elementString.length !== 0) ?  elem.name + "/" + elementString : elem.name;
                elem = elem._parent;
            }
            while (target._parent._parent !== null) {
                targetString = (targetString.length !== 0) ?  target.name + "/" + targetString : target.name;
                target = target._parent;
            }

            var idx;
            for (i = 0; i < (elementString.length < targetString.length) ? elementString.length : targetString.length; i++) {

                if (elementString[i] === targetString[i]) {
                    if (elementString[i] === '/' && targetString[i] === '/') {
                        idx = i + 1;
                    }
                } else {
                    break;
                }
            }
            // remove common path
            elementString = elementString.substring(idx, elementString.length);
            targetString = targetString.substring(idx, targetString.length);

            for (i = 0; i < elementString.split('/').length - 1; i++) {
                header += "../";
            }
            header += targetString;

            return header;
        };


        var headerString = "";
        if (Repository.getRelationshipsOf(elem).length <= 0) {
            return "";
        }
        var associations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation);
        });
        var realizations = Repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization || rel instanceof type.UMLGeneralization);
        });

        // check for interface or class
        for (i = 0; i < realizations.length; i++) {
            var realize = realizations[i];
            if (realize.target === elem) {
                continue;
            }
            headerString += "# include\t\t\t\"" + trackingHeader(elem, realize.target) + "." + this.genOptions.headerFormat + "\"\n";
        }

        // check for member variable
        for (i = 0; i < associations.length; i++) {
            var asso = associations[i];
            var target;
            if (asso.end1.reference === elem && asso.end2.navigable === true && asso.end2.name.length !== 0) {
                target = asso.end2.reference;
            } else if (asso.end2.reference === elem && asso.end1.navigable === true && asso.end1.name.length !== 0) {
                target = asso.end1.reference;
            } else {
                continue;
            }
            if (target === elem) {
                continue;
            }
            headerString += "# include\t\t\t\"" + trackingHeader(elem, target) + "." + this.genOptions.headerFormat + "\"\n";
        }

        return headerString;
    };

    /**
     * Classfy method and attribute by accessor.(public, private, protected)
     *
     * @param {Object} items
     * @return {Object} list
     */
    CppCodeGenerator.prototype.classifyVisibility = function (items) {
        var public_list = [];
        var protected_list = [];
        var private_list = [];
        var i;
        for (i = 0; i < items.length; i++) {

            var item = items[i];
            var visib = this.getVisibility(item);

            if ("public" === visib) {
                public_list.push(item);
            } else if ("private" === visib) {
                private_list.push(item);
            } else {
                // if modifier not setted, consider it as protected
                protected_list.push(item);
            }
        }
        return {
            _public : public_list,
            _protected : protected_list,
            _private : private_list
        };
    };
	
	/**
	 * Resolve namespace
	 * 
	 * @param {String} type
	 * @return {String} type
	 */
	CppCodeGenerator.prototype.resolveNamespaceType = function(type) {
		if (type === undefined || type === null) {
			return type;
		}
		
		while (this.genOptions.stdNamespace.length > 0 && type.indexOf(this.genOptions.stdNamespace) != -1) {
			type = type.replace(this.genOptions.stdNamespace, "::");
		}
		
		while (type.indexOf("<") != -1 && type.indexOf(this.genOptions.separator) != -1 && this.genOptions.separator.length > 0) {
			type = type.replace(this.genOptions.separator, ",");
		}
		
		return type;
	};
	
    /**
     * generate variables from attributes[i]
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getMemberVariable = function (elem) {
        if (elem.name.length > 0) {
            //var docs = this.getDocuments(elem.documentation);
            var _modifiers = this.getModifiers(elem);
			var terms = [];
			
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(" "));
            }
            
            terms.push(this.getType(elem));
            terms.push("\t\t\t" + this.genOptions.attributeName + elem.name);
			
            if (this.genOptions.isCpp11 && elem.defaultValue && elem.defaultValue.length > 0) {
                terms.push("= " + elem.defaultValue);
            }
            return (/*docs + */ terms.join(" ") + ";");
        }
    };

    /**
     * generate methods from operations[i]
     *
     * @param {Object} elem
     * @param {boolean} isCppBody
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getMethod = function (elem, isCppBody) {
        if (elem.name.length > 0) {
			var docs = elem.documentation;
            var methodStr = "";
            var i;
			
            if (elem.isStatic === true) {
                methodStr += "static ";
            } else if (elem.isAbstract === true) {
                methodStr += "virtual ";
            }

            var returnTypeParam = _.filter(elem.parameters, function (params) {
                return params.direction === "return";
            });
            var inputParams = _.filter(elem.parameters, function (params) {
                return params.direction === "in";
            });
			
            var inputParamStrings = [];
			var parametersName = [];
			
            for (i = 0; i < inputParams.length; i++) {
                var inputParam = inputParams[i];
				if (isCppBody) {
					inputParamStrings.push(this.resolveNamespaceType(inputParam.name) + " arg" + i);
				} else {
					inputParamStrings.push(this.resolveNamespaceType(inputParam.name));
				}
				parametersName.push("arg" + i);
                docs += "\n@param " + this.resolveNamespaceType(inputParam.name);
            }
			
			var hasReturn = returnTypeParam.length > 0;
			
			methodStr += this.resolveNamespaceType((hasReturn) ? returnTypeParam[0].type : "void");
			methodStr += "\t\t\t\t";

            if (isCppBody) {
                var t_elem = elem;
                var specifier = "";
				
                while (t_elem._parent instanceof type.UMLClass) {
                    specifier = t_elem._parent.name + "::" + specifier;
                    t_elem = t_elem._parent;
                }
				
                var indentLine = "";

                for (i = 0; i < this.genOptions.indentSpaces; i++) {
                    indentLine += " ";
                }
				
				methodStr += "\t";
                methodStr += this.resolveNamespaceType(specifier);
                methodStr += elem.name;
                methodStr += "(" + inputParamStrings.join(", ") + ")";
				
				if (elem.isLeaf === true) {
					methodStr += " const";
				}
				
				methodStr += "\n{\n";
				
                if (hasReturn) {
                    var returnType = returnTypeParam[0].type;
					
                    if (returnType === "bool") {
                        methodStr += indentLine + "return (false);";
                    } else if (returnType === "double" || returnType === "float" ||
								returnType === "unsigned double" || returnType === "unsigned float") {
                        methodStr += indentLine + "return (0.0);";
                    } else if (returnType === "char" || returnType === "unsigned char") {
                        methodStr += indentLine + "return ('\0');";
                    } else if (returnType.indexOf("string") != -1) {
                        methodStr += indentLine + 'return ("");';
                    } else if (returnType === "void") {
                        methodStr += indentLine + "return ;";
                    } else if (returnType.indexOf("*") == returnType.length - 1) {
                        methodStr += indentLine + "return (NULL);";
                    } else if (returnType.indexOf("&") == returnType.length - 1) {
						methodStr += indentLine + "return (*this);";
					} else {
						methodStr += indentLine + "return (0);";
					}
					
                    docs += "\n@return " + this.resolveNamespaceType(returnType);
                }
				
                methodStr += "\n}\n";
				
				if (this.genOptions.doxygenTemplate) {
					methodStr = this.getDoxygenTemplate(true, hasReturn, inputParamStrings) + methodStr;
				}
            } else {
                methodStr += elem.name;
                methodStr += "(" + inputParamStrings.join(", ") + ")";
				
                if (elem.isLeaf === true) {
                    methodStr += " const";
                }
				if (elem.isAbstract === true) {
                    methodStr += " = 0";
                }
                methodStr += ";";
            }
			
            return methodStr;
        }
    };

    /**
     * generate doc string from doc element
     *
     * @param {Object} text
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getDocuments = function (text) {
        var docs = "";
		
		if (this.comments === undefined || this.comments === null) {
			this.comments = new Comments(false);
		}
		
        if (_.isString(text) && text.length !== 0) {
            var lines = text.trim().split("\n");
            docs += this.comments.start + "\n";
            var i;
            for (i = 0; i < lines.length; i++) {
                docs += this.comments.middle + " " + lines[i] + "\n";
            }
            docs += this.comments.end + "\n";
        }
        return docs;
    };

    /**
     * parsing visibility from element
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getVisibility = function (elem) {
        switch (elem.visibility) {
			case UML.VK_PUBLIC:
				return "public";
			case UML.VK_PROTECTED:
				return "protected";
			case UML.VK_PRIVATE:
				return "private";
        }
        return null;
    };

    /**
     * parsing modifiers from element
     *
     * @param {Object} elem
     * @return {Object} list
     */
    CppCodeGenerator.prototype.getModifiers = function (elem) {
        var modifiers = [];

        if (elem.isStatic === true) {
            modifiers.push("static");
        }
        if (elem.isReadOnly === true) {
            modifiers.push("const");
        }
        if (elem.isAbstract === true) {
            modifiers.push("virtual");
        }
        return modifiers;
    };

    /**
     * parsing type from element
     *
     * @param {Object} elem
     * @return {Object} string
     */
    CppCodeGenerator.prototype.getType = function (elem) {
        var _type = "void";

        if (elem instanceof type.UMLAssociationEnd) { // member variable from association
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name;
            }
        } else { // member variable inside class
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name;
            } else if (_.isString(elem.type) && elem.type.length > 0) {
                _type = elem.type;
            }
        }

        // multiplicity
        if (elem.multiplicity) {
            if (_.contains(["0..*", "1..*", "*"], elem.multiplicity.trim())) {
                if (elem.isOrdered === true) {
                    _type = "vector<" + _type + ">";
                } else {
                    _type = "vector<" + _type + ">";
                }
            } else if (elem.multiplicity !== "1" && elem.multiplicity.match(/^\d+$/)) { // number
                //TODO check here
                _type += "[]";
            }
        }
        return this.resolveNamespaceType(_type);
    };
	
	
    /**
     * get all super class / interface from element
     *
     * @param {Object} elem
     * @return {Object} list
     */
    CppCodeGenerator.prototype.getSuperClasses = function (elem) {
        var generalizations = Repository.getRelationshipsOf(elem, function (rel) {
            return ((rel instanceof type.UMLGeneralization || rel instanceof type.UMLInterfaceRealization) && rel.source === elem);
        });
        return generalizations;
    };
	
	
    function generate(baseModel, basePath, options) {
        var result = new $.Deferred();
        var cppCodeGenerator = new CppCodeGenerator(baseModel, basePath);
        return cppCodeGenerator.generate(baseModel, basePath, options);
    }

    function getVersion() {return versionString; }

    exports.generate = generate;
    exports.getVersion = getVersion;
});
