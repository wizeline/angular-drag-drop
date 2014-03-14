angular.module('dragAndDrop', [])
  .directive( 'drag', function ( dndApi ) {

    var drags = [];
    var parent = function(drag, max) {
      if(max > 5) {  return false; } /* Just incase */
      var p = drag.parent();
      if(p.hasClass('drop')) {
        return p[0];
      } else {
        max++;
        return parent(p, max);
      }
    };
    var attrs = ['start', 'end'];

    return {
      restrict: 'A',
      scope: {
        drag: '=',
        dragEnable: '&',
        drawImage: '=',
        endHandler: '='
      },
      link: function ( $scope, $elem, $attr ) {
        var me = {},
            drawImage = null;

        angular.forEach(attrs, function(attr, key) {
          if($attr[attr]) { me[attr] = $scope.$eval($attr[attr]); }
        });
        var elem  = $elem[0];

        elem.addEventListener( 'dragstart', function ( e ) {
          if(!$scope.dragEnable()) {
            return false;
          }
          if(drags.length === 0) { drags = document.querySelectorAll( '.drop' ); }

          angular.forEach(dndApi.areas(), function ( value, key ) {
            if(value[0] !== parent($elem, 0)) { value.addClass('draging'); }
          });

          if (me.end === undefined && $scope.endHandler) {
            me.end = $scope.endHandler;
          }

          $elem.addClass('on-drag');

          dndApi.setData($scope.drag, $elem);

          (e.originalEvent || e).dataTransfer.effectAllowed = 'move';

          (e.originalEvent || e).dataTransfer.setData( 'text', 'test' );

          if ($scope.drawImage) {
            dragImageElement = document.getElementById('blank-image');
            (e.originalEvent || e).dataTransfer.setDragImage(dragImageElement, 0, 0);
          }

          if(angular.isFunction(me.start)) {
            $scope.$apply(function() {
              me.start(dndApi.getData(), $elem);
            });
          }

        });

        elem.addEventListener( 'dragend', function ( e ) {

          $elem.removeClass('on-drag');

          angular.forEach(dndApi.areas(), function ( area, key ) {
            area.removeClass('draging');
          });

          if(angular.isFunction(me.end)){
            $scope.$apply(function() {
              me.end(dndApi.getData(), $elem);
            });
          }
          dndApi.clear();
        });

        elem.draggable = true;
        $elem.addClass('drag');
      }
    };
  }).directive( 'drop', function ( dndApi ) {

    var areas = [];
    var drags = [];
    var attrs = ['drop', 'enter', 'leave', 'track'];

    return {
      link: function ( $scope, $elem, $attr ) {

        var me      = {};
        var elem    = $elem[0];
        var left    = elem.offsetLeft,
            right   = left + elem.offsetWidth,
            top     = elem.offsetTop,
            bottom  = top + elem.offsetHeight;

        angular.forEach(attrs, function(attr, key) {
          if($attr[attr]) { me[attr] = $scope.$eval($attr[attr]); }
        });

        dndApi.addArea($elem);

        elem.addEventListener( 'drop', function ( e ) {
          if (e.preventDefault) { e.preventDefault(); }

          var result = dndApi.getData();
          if(!$elem.hasClass('draging')){ return; }
          if(angular.isFunction(me.drop)) {
            $scope.$apply(function() {
              me.drop(result.data, me.track, result.element);
            });
          }

          angular.forEach(dndApi.areas(), function (area, key) {
            area.addClass('draging');
          });

          dndApi.clear();
        });

        elem.addEventListener ('dragenter', function(e) {
          var enterOnTarget = function enterOnTarget () {
            return angular.element(elem).find(e.target).length > 0;
          };
          if(enterOnTarget() && angular.isFunction(me.enter)) {
            $scope.$apply(function() {
              var result = dndApi.getData();
              me.enter(result.data, me.track, result.element);
            });
          }
        });

        elem.addEventListener ( 'dragleave', function(e) {
          if((e.x < left || e.x > right) || (e.y < top  || e.y > bottom)) {
            if(angular.isFunction(me.leave)){
              $scope.$apply(function() {
                var result = dndApi.getData();
                me.leave(result.data, me.track, result.element);
              });
            }
          }
        });

        elem.addEventListener ( 'dragover', function ( e ) {
          if (e.preventDefault) { e.preventDefault(); }
          return false;
        });

        $elem.addClass('drop');
      }
    };

  }).factory('dndApi', function() {

    var dnd = {
      dragObject : {}
    };

    var areas = [];

    return {
      addArea : function(area){
        areas.push(area);
      },
      areas : function() {
        return areas;
      },
      setData : function(data, element) {
        dnd.drag = { data : data, element : element};
      },
      clear : function(){
        delete dnd.drag;
      },
      getData : function(){
        return dnd.drag;
      }
    };
  });



