<?php

class NewsController
{
	function actions()
	{
		$action = request_str('action');
		if(method_exists($this, $action.'Action')) {
			echo call_user_func(array($this, $action.'Action'));
		} else {
			echo $this->defaultAction();
		}
	}

	function defaultAction()
	{
		$html = '';

		$page = new PageCommon(s('News'));

		$html .= $page->start();

		$html .= '<div class="row" style="margin-bottom:200px"><div class="col-md-offset-1 col-md-7"><h1>' . s('News') . '</h1><ul class="news-list">';

		foreach (Core::$sql->get('*', DB . 'news order by datetime_stamp desc') as $row)
		{
            translateFields(array('title', 'description'), $row);

            $html .= '<li><div class="item-date">' . time_format_date($row['datetime_stamp']) . '</div>'
				. '<h3><a name="' . $row['id'] . '"></a>' . ($row['title']) . '</h3>'
				. '<p>' . ($row['description']) . '</p>'
				. '</li>';
		}

		$html .= '</ul></div></div>';

		$html .= $page->stop();

		return $html;
	}
}
